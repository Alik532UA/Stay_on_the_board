import { roomPlayerService } from "$lib/services/room/roomPlayerService";
import { presenceService } from "$lib/services/presenceService";
import { logService } from "$lib/services/logService";
import type { OnlinePlayer, Room } from "$lib/types/online";
import { modalStore } from '$lib/stores/modalStore';
import { timeService } from '$lib/services/timeService';
import ReconnectionModal from '$lib/components/modals/ReconnectionModal.svelte';
import { get } from 'svelte/store';

type DisconnectHandler = (playerId: string, disconnectStartedAt: number) => void;
type ReconnectHandler = (playerId: string) => void;

interface PresenceConfig {
    roomId: string;
    myPlayerId: string;
    isHost: () => boolean;
    getPlayers: () => OnlinePlayer[];
}

export class OnlinePresenceManager {
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private monitorInterval: NodeJS.Timeout | null = null;
    private unsubscribeFromRtdb: (() => void) | null = null;
    private rtStatuses: Record<string, { state: string, last_changed: number }> = {};

    // Config constants
    private readonly HEARTBEAT_MS = 5000;
    private readonly MONITOR_MS = 2000;
    private readonly DISCONNECT_THRESHOLD_MS = 15000;
    private readonly KICK_TIMEOUT_MS = 30000;
    // FIX: Grace period для уникнення помилкового disconnect при старті гри
    private readonly PRESENCE_GRACE_PERIOD_MS = 4000;
    private readonly startedAt: number = Date.now();

    public onPlayerDisconnect: DisconnectHandler | null = null;
    public onPlayerReconnect: ReconnectHandler | null = null;

    constructor(private config: PresenceConfig) {
        this.startedAt = Date.now();
    }

    public start(): void {
        this.startHeartbeat();
        this.startRealtimePresence();
        this.startMonitoring();
    }

    public stop(): void {
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
        // Встановлюємо офлайн при виході
        presenceService.setOffline(this.config.roomId, this.config.myPlayerId).catch(() => {});
    }

    private startRealtimePresence(): void {
        // 1. Починаємо трекати себе (Connected -> OnDisconnect: Offline)
        presenceService.trackPresence(this.config.roomId, this.config.myPlayerId);

        // 2. Підписуємось на зміни статусів всіх у кімнаті
        this.unsubscribeFromRtdb = presenceService.subscribeToRoomPresence(
            this.config.roomId,
            (statuses) => {
                this.rtStatuses = statuses;
                logService.GAME_MODE(`[Presence] RTDB Update: ${JSON.stringify(statuses)}`);

                // МИТТЄВА РЕАКЦІЯ: Якщо суперник став offline, показуємо модалку не чекаючи Firestore
                Object.entries(statuses).forEach(([playerId, status]) => {
                    if (playerId !== this.config.myPlayerId && status.state === 'offline') {
                        this.triggerDisconnect(playerId, status.last_changed);
                    } else if (playerId !== this.config.myPlayerId && status.state === 'online') {
                        this.triggerReconnect();
                    }
                });
            }
        );
    }

    private triggerDisconnect(playerId: string, timestamp: number): void {
        const players = this.config.getPlayers();
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        // Grace period не потрібен для RTDB подій, бо вони явні.
        // const timeSinceStart = Date.now() - this.startedAt;
        // if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) return;

        const currentModal = get(modalStore);
        if (!currentModal.isOpen || currentModal.dataTestId !== 'reconnection-modal') {
            logService.init(`[PresenceManager] RTDB: Player ${player.name} offline. Showing modal.`);
            timeService.pauseTurnTimer();

            modalStore.showModal({
                component: ReconnectionModal,
                variant: 'menu',
                dataTestId: 'reconnection-modal',
                content: {
                    playerName: player.name,
                    opponentId: player.id, // Додано ID опонента
                    disconnectStartedAt: timestamp || Date.now(),
                    roomId: this.config.roomId,
                    myPlayerId: this.config.myPlayerId
                },
                closable: false,
                closeOnOverlayClick: false
            });
        }
    }

    private triggerReconnect(): void {
        const currentModal = get(modalStore);
        if (currentModal.isOpen && currentModal.dataTestId === 'reconnection-modal') {
            logService.init(`[PresenceManager] RTDB: Player returned. Closing modal.`);
            modalStore.closeModal();
            timeService.resumeTurnTimer();
        }
    }

    // Метод для обробки оновлень кімнати з Firestore (як запасний варіант)
    public handleRoomUpdate(room: Room): void {
        if (room.status !== 'playing') return;

        const timeSinceStart = Date.now() - this.startedAt;
        if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) return;

        const players = Object.values(room.players);
        const disconnectedPlayer = players.find(p => p.isDisconnected && p.id !== this.config.myPlayerId);
        
        if (disconnectedPlayer) {
            // FIX: Перевірка конфлікту правди.
            // Якщо Firestore каже disconnected, але RTDB каже online - віримо RTDB (вона швидша).
            const rtStatus = this.rtStatuses[disconnectedPlayer.id];
            const isRtOnline = rtStatus && rtStatus.state === 'online';

            if (!isRtOnline) {
                this.triggerDisconnect(disconnectedPlayer.id, disconnectedPlayer.disconnectStartedAt || Date.now());
            } else {
                logService.GAME_MODE(`[Presence] Firestore says disconnected, but RTDB says online. Ignoring Firestore.`);
                // Можливо, варто спробувати закрити модалку, якщо вона відкрита?
                this.triggerReconnect();
            }
        } else {
            // Перевіряємо, чи всі гравці онлайн в RTDB перед тим як ховати модалку
            const anyRtOffline = Object.entries(this.rtStatuses).some(
                ([id, s]) => id !== this.config.myPlayerId && s.state === 'offline'
            );
            if (!anyRtOffline) {
                this.triggerReconnect();
            }
        }
    }

    private startHeartbeat(): void {
        logService.init(`[PresenceManager] Starting heartbeat for player ${this.config.myPlayerId}`);
        const send = async () => {
            if (!this.heartbeatInterval) return;

            try {
                await roomPlayerService.sendHeartbeat(this.config.roomId, this.config.myPlayerId);
                // logService.init(`[PresenceManager] Heartbeat sent for ${this.config.myPlayerId}`);
            } catch (e: any) {
                if (e.code === 'not-found' || e.message?.includes('No document to update')) {
                    logService.init(`[Presence] Room ${this.config.roomId} not found. Stopping heartbeat.`);
                    this.stop();
                } else {
                    console.warn("[Presence] Heartbeat failed", e);
                }
            }
        };

        send();
        this.heartbeatInterval = setInterval(send, this.HEARTBEAT_MS);
    }

    private startMonitoring(): void {
        if (!this.config.isHost()) {
            logService.init(`[PresenceManager] Skipping monitoring (not host)`);
            return;
        }
        logService.init(`[PresenceManager] Starting monitoring as host`);
        this.monitorInterval = setInterval(async () => {
            if (!this.config.isHost()) return;

            // FIX: Grace period - не позначаємо гравців як disconnected протягом перших 10 секунд
            const timeSinceStart = Date.now() - this.startedAt;
            if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) {
                return;
            }

            const now = Date.now();
            const players = this.config.getPlayers();

            // DEBUG: Логування для діагностики
            // logService.GAME_MODE(`[Presence] Monitoring: ${players.length} players in room`);

            for (const player of players) {
                if (player.id === this.config.myPlayerId) continue;

                const lastSeen = player.lastSeen || player.joinedAt;
                const timeSinceSeen = now - lastSeen;
                
                // Перевірка статусу в Realtime Database
                const rtStatus = this.rtStatuses[player.id];
                const isRtOffline = rtStatus && rtStatus.state === 'offline';
                
                // FIX: Захист від хибних спрацьовувань (Debounce).
                // Якщо RTDB каже offline, але гравець був активний менше 2с тому (heartbeat/move),
                // то це ймовірно глюк з'єднання або затримка RTDB. Ігноруємо.
                const isRecentlyActive = timeSinceSeen < 2000;

                // DEBUG: Логування прийняття рішення
                if (isRtOffline) {
                    logService.GAME_MODE(`[Presence] CHECK: ${player.name} | RT: Offline | TimeSinceSeen: ${timeSinceSeen}ms | RecentlyActive: ${isRecentlyActive}`);
                }

                if (!player.isDisconnected) {
                    // ГІПОТЕЗА: isRecentlyActive блокує валідні disconnects при закритті вкладки.
                    // Тимчасово прибираємо цей чек для тесту "миттєвого" реагування.
                    // Було: (isRtOffline && !isRecentlyActive)
                    const shouldMarkDisconnected = isRtOffline || timeSinceSeen > this.DISCONNECT_THRESHOLD_MS;

                    if (shouldMarkDisconnected) {
                        const reason = isRtOffline ? 'RTDB Offline' : `Timeout (${Math.round(timeSinceSeen / 1000)}s)`;
                        logService.init(`[Presence] Player ${player.name} disconnected. Reason: ${reason}. Marking disconnected.`);

                        try {
                            await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                                isDisconnected: true,
                                disconnectStartedAt: now
                            });
                        } catch (e) { }
                    }
                } else {
                    // Гравець повертається
                    const isRtOnline = rtStatus && rtStatus.state === 'online';
                    
                    // Він вважається повернутим, якщо RTDB каже online АБО оновився lastSeen
                    if (isRtOnline || timeSinceSeen < this.DISCONNECT_THRESHOLD_MS) {
                        logService.init(`[Presence] Player ${player.name} returned! Removing disconnected flag.`);
                        try {
                            await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                                isDisconnected: false,
                                disconnectStartedAt: undefined
                            });
                        } catch (e) { }
                    }
                    else if (player.disconnectStartedAt && (now - player.disconnectStartedAt > this.KICK_TIMEOUT_MS)) {
                        logService.init(`[Presence] Player ${player.name} kick timer expired (>30s). Kicking from room.`);
                        try {
                            await roomPlayerService.leaveRoom(this.config.roomId, player.id);
                        } catch (e) { }
                    }
                }
            }
        }, this.MONITOR_MS);
    }
}