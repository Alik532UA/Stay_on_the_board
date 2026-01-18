import { roomPlayerService } from "$lib/services/room/roomPlayerService";
import { presenceService } from "$lib/services/presenceService";
import { logService } from "$lib/services/logService";
import type { OnlinePlayer, Room } from "$lib/types/online";
import { modalStore } from '$lib/stores/modalStore';
import { timeService } from '$lib/services/timeService';
import ReconnectionModal from '$lib/components/modals/ReconnectionModal.svelte';
import { get } from 'svelte/store';
import { reconnectionStore } from '$lib/stores/reconnectionStore';
import { uiStateStore } from '$lib/stores/uiStateStore';

type DisconnectHandler = (playerId: string, disconnectStartedAt: number) => void;
type ReconnectHandler = (playerId: string) => void;

interface PresenceConfig {
    roomId: string;
    myPlayerId: string;
    isHost: () => boolean;
    getPlayers: () => OnlinePlayer[];
    onAllOpponentsLeft?: () => void;
}

export class OnlinePresenceManager {
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private monitorInterval: NodeJS.Timeout | null = null;
    private unsubscribeFromRtdb: (() => void) | null = null;
    private unsubscribeFromStore: (() => void) | null = null;
    // Статуси з RTDB (швидке джерело правди для disconnect)
    private rtStatuses: Record<string, { state: string, last_changed: number }> = {};
    // Кеш імен гравців для випадків коли гравець вже видалений з кімнати
    private playerNamesCache: Record<string, string> = {};

    // Config constants
    private readonly HEARTBEAT_MS = 5000; // Швидкий heartbeat для своєчасного виявлення disconnect
    private readonly MONITOR_MS = 2000;
    private readonly DISCONNECT_THRESHOLD_MS = 60000; // Fallback таймаут якщо RTDB не працює
    private readonly KICK_TIMEOUT_MS = 30000;
    private readonly PRESENCE_GRACE_PERIOD_MS = 4000; // Grace period при старті гри
    private readonly startedAt: number = Date.now();

    public onPlayerDisconnect: DisconnectHandler | null = null;
    public onPlayerReconnect: ReconnectHandler | null = null;

    constructor(private config: PresenceConfig) {
        this.startedAt = Date.now();
        reconnectionStore.init(config.roomId, config.myPlayerId);

        // Автоматичне керування модалкою на основі стану reconnectionStore
        this.unsubscribeFromStore = reconnectionStore.subscribe(state => {
            const currentModal = get(modalStore);
            const hasPlayers = state.players.length > 0;
            const isReconnectionModalOpen = currentModal.isOpen && currentModal.dataTestId === 'reconnection-modal';
            const isGameOver = get(uiStateStore).isGameOver;

            if (isGameOver) {
                // Якщо гра завершена, закриваємо модалку очікування
                if (isReconnectionModalOpen) {
                    logService.presence(`[Presence] Game Over. Closing ReconnectionModal.`);
                    modalStore.closeModal();
                    timeService.resumeTurnTimer();
                }
                return;
            }

            if (hasPlayers && !isReconnectionModalOpen) {
                logService.presence(`[Presence] Players disconnected (${state.players.length}). Opening modal.`);
                timeService.pauseTurnTimer();
                modalStore.showModal({
                    component: ReconnectionModal,
                    variant: 'menu',
                    dataTestId: 'reconnection-modal',
                    content: {},
                    closable: false,
                    closeOnOverlayClick: false
                });
            } else if (!hasPlayers && isReconnectionModalOpen) {
                logService.presence(`[Presence] All players returned. Closing modal.`);
                modalStore.closeModal();
                timeService.resumeTurnTimer();
            }
        });
    }

    public start(): void {
        logService.presence(`[Presence] Starting... Grace period: ${this.PRESENCE_GRACE_PERIOD_MS}ms`);
        this.startHeartbeat();
        this.startRealtimePresence();
        this.startMonitoring();
    }

    public stop(): void {
        logService.presence('[Presence] Stopping...');

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        if (this.unsubscribeFromRtdb) {
            this.unsubscribeFromRtdb();
            this.unsubscribeFromRtdb = null;
        }
        if (this.unsubscribeFromStore) {
            this.unsubscribeFromStore();
            this.unsubscribeFromStore = null;
        }
        reconnectionStore.reset();

        // Встановлюємо офлайн при виході
        presenceService.setOffline(this.config.roomId, this.config.myPlayerId).catch(() => { });
    }

    /**
     * Підписка на RTDB для миттєвого виявлення disconnect.
     * RTDB onDisconnect спрацьовує коли клієнт втрачає з'єднання (закриває вкладку, мережа падає).
     */
    private startRealtimePresence(): void {
        // 1. Реєструємо себе в RTDB (trackPresence встановлює onDisconnect тригер)
        presenceService.trackPresence(this.config.roomId, this.config.myPlayerId);

        // 2. Підписуємось на зміни статусів ВСІХ гравців у кімнаті через RTDB
        // Це КЛЮЧОВА підписка - вона миттєво отримує оновлення коли хтось відключається
        this.unsubscribeFromRtdb = presenceService.subscribeToRoomPresence(
            this.config.roomId,
            (statuses) => {
                this.rtStatuses = statuses;
                logService.presence(`[Presence] RTDB Update: ${JSON.stringify(statuses)}`);

                const timeSinceStart = Date.now() - this.startedAt;
                if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) {
                    logService.presence('[Presence] Skipping RTDB check during grace period.');
                    return;
                }

                // МИТТЄВА РЕАКЦІЯ: Якщо суперник став offline, додаємо в стор
                Object.entries(statuses).forEach(([playerId, status]) => {
                    if (playerId !== this.config.myPlayerId) {
                        if (status.state === 'offline') {
                            this.triggerDisconnect(playerId, status.last_changed);
                        } else if (status.state === 'online') {
                            this.triggerReconnect(playerId);
                        }
                    }
                });
            }
        );
    }

    private triggerDisconnect(playerId: string, timestamp: number): void {
        const players = this.config.getPlayers();
        let player = players.find(p => p.id === playerId);

        let playerName: string;
        if (player) {
            playerName = player.name;
            this.playerNamesCache[playerId] = playerName;
        } else if (this.playerNamesCache[playerId]) {
            playerName = this.playerNamesCache[playerId];
            logService.presence(`[Presence] triggerDisconnect: Player ${playerId} not in room, using cached name: ${playerName}`);
        } else {
            logService.presence(`[Presence] triggerDisconnect: Player ${playerId} not found. Skipping.`);
            return;
        }

        logService.presence(`[Presence] Player ${playerName} disconnected. Adding to reconnectionStore.`);
        reconnectionStore.addPlayer({ id: playerId, name: playerName });
    }

    private triggerReconnect(playerId: string): void {
        reconnectionStore.removePlayer(playerId);
    }

    /**
     * Обробка оновлень кімнати з Firestore (запасний варіант та кешування імен)
     */
    public handleRoomUpdate(room: Room): void {
        if (room.status !== 'playing') return;

        const timeSinceStart = Date.now() - this.startedAt;
        if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) return;

        const players = Object.values(room.players);
        const currentPlayerIds = new Set(players.map(p => p.id));

        // Кешуємо імена гравців
        players.forEach(p => {
            if (p.id !== this.config.myPlayerId) {
                this.playerNamesCache[p.id] = p.name;
            }
        });

        // Перевіряємо всіх гравців
        players.forEach(p => {
            if (p.id === this.config.myPlayerId) return;

            if (p.isDisconnected) {
                const rtStatus = this.rtStatuses[p.id];
                const isRtOnline = rtStatus && rtStatus.state === 'online';

                if (!isRtOnline) {
                    this.triggerDisconnect(p.id, p.disconnectStartedAt || Date.now());
                } else {
                    logService.presence(`[Presence] Firestore says disconnected, but RTDB says online for ${p.name}. Trusting RTDB.`);
                    this.triggerReconnect(p.id);
                }
            } else {
                // Гравець online за даними Firestore - видаляємо з reconnectionStore якщо він там є
                this.triggerReconnect(p.id);
            }
        });

        // Перевіряємо чи хтось зник з кімнати
        const state = get(reconnectionStore);
        state.players.forEach(p => {
            if (!currentPlayerIds.has(p.id)) {
                logService.presence(`[Presence] Player ${p.name} left the room completely. Removing from store.`);
                reconnectionStore.removePlayer(p.id);
                delete this.playerNamesCache[p.id];
            }
        });
    }

    private startHeartbeat(): void {
        logService.presence(`[Presence] Starting heartbeat for ${this.config.myPlayerId}`);

        const send = async () => {
            if (!this.heartbeatInterval) return;

            try {
                await roomPlayerService.sendHeartbeat(this.config.roomId, this.config.myPlayerId);
            } catch (e: any) {
                if (e.code === 'not-found' || e.message?.includes('No document to update')) {
                    logService.presence(`[Presence] Room not found. Stopping heartbeat.`);
                    this.stop();
                } else {
                    console.warn("[Presence] Heartbeat failed", e);
                }
            }
        };

        send();
        this.heartbeatInterval = setInterval(send, this.HEARTBEAT_MS);
    }

    /**
     * Моніторинг виконується ТІЛЬКИ хостом.
     * Оновлює isDisconnected в головному документі кімнати на основі RTDB статусів.
     */
    private startMonitoring(): void {
        if (!this.config.isHost()) {
            logService.presence(`[Presence] Skipping monitoring (not host)`);
            return;
        }

        logService.presence(`[Presence] Starting monitoring as host`);

        this.monitorInterval = setInterval(async () => {
            if (!this.config.isHost()) return;

            const timeSinceStart = Date.now() - this.startedAt;
            if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) return;

            const now = Date.now();
            const players = this.config.getPlayers();

            for (const player of players) {
                if (player.id === this.config.myPlayerId) continue;

                const lastSeen = player.lastSeen || player.joinedAt;
                const timeSinceSeen = now - lastSeen;

                // Статус з RTDB
                const rtStatus = this.rtStatuses[player.id];
                const isRtOffline = rtStatus && rtStatus.state === 'offline';
                const isRtOnline = rtStatus && rtStatus.state === 'online';

                if (!player.isDisconnected) {
                    // Якщо RTDB каже ONLINE - довіряємо
                    if (isRtOnline) continue;

                    // Вважаємо відключеним якщо:
                    // 1. RTDB каже Offline
                    // 2. АБО таймаут без сигналу RTDB
                    const shouldMarkDisconnected = isRtOffline || timeSinceSeen > this.DISCONNECT_THRESHOLD_MS;

                    if (shouldMarkDisconnected) {
                        const reason = isRtOffline ? 'RTDB Offline' : `Timeout (${Math.round(timeSinceSeen / 1000)}s)`;
                        logService.presence(`[Presence] Marking ${player.name} as disconnected. Reason: ${reason}`);

                        try {
                            await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                                isDisconnected: true,
                                disconnectStartedAt: now
                            });
                        } catch (e) {
                            logService.error(`[Presence] Failed to mark player disconnected`, e);
                        }
                    }
                } else {
                    // Гравець вже позначений як disconnected

                    // Перевіряємо чи повернувся
                    if (isRtOnline || timeSinceSeen < (this.DISCONNECT_THRESHOLD_MS / 2)) {
                        logService.presence(`[Presence] Player ${player.name} returned! Removing disconnected flag.`);
                        try {
                            await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                                isDisconnected: false,
                                disconnectStartedAt: undefined
                            });
                        } catch (e) {
                            logService.error(`[Presence] Failed to mark player connected`, e);
                        }
                    }
                    // Перевіряємо чи пора кікати
                    else if (player.disconnectStartedAt && (now - player.disconnectStartedAt > this.KICK_TIMEOUT_MS)) {
                        logService.presence(`[Presence] Player ${player.name} kick timer expired (>${this.KICK_TIMEOUT_MS / 1000}s). Kicking.`);
                        try {
                            await roomPlayerService.leaveRoom(this.config.roomId, player.id);
                        } catch (e) {
                            logService.error(`[Presence] Failed to kick player`, e);
                        }
                    }
                }
            }
        }, this.MONITOR_MS);
    }
}