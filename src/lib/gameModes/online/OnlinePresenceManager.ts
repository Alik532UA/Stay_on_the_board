import { roomPlayerService } from "$lib/services/room/roomPlayerService";
import { presenceService } from "$lib/services/presenceService";
import { logService } from "$lib/services/logService";
import type { OnlinePlayer, Room } from "$lib/types/online";
import { modalStore } from '$lib/stores/modalStore';
import { timeService } from '$lib/services/timeService';
import ReconnectionModal from '$lib/components/modals/ReconnectionModal.svelte';
import { get } from 'svelte/store';
import { reconnectionStore } from '$lib/stores/reconnectionStore';

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
    private unsubscribeFromStore: (() => void) | null = null;
    private rtStatuses: Record<string, { state: string, last_changed: number }> = {};

    // Config constants
    private readonly HEARTBEAT_MS = 5000;
    private readonly MONITOR_MS = 2000;
    // FIX: Збільшуємо поріг таймауту для Firestore до 60с, щоб уникнути хибних спрацьовувань через лаги
    private readonly DISCONNECT_THRESHOLD_MS = 60000;
    private readonly KICK_TIMEOUT_MS = 30000;
    // FIX: Grace period для уникнення помилкового disconnect при старті гри
    private readonly PRESENCE_GRACE_PERIOD_MS = 4000;
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

            if (hasPlayers && !isReconnectionModalOpen) {
                logService.init(`[Presence] Players disconnected (${state.players.length}). Opening modal.`);
                timeService.pauseTurnTimer();
                modalStore.showModal({
                    component: ReconnectionModal,
                    variant: 'menu',
                    dataTestId: 'reconnection-modal',
                    content: {}, // Дані тепер беруться зі стору
                    closable: false,
                    closeOnOverlayClick: false
                });
            } else if (!hasPlayers && isReconnectionModalOpen) {
                logService.init(`[Presence] All players returned. Closing modal.`);
                modalStore.closeModal();
                timeService.resumeTurnTimer();
            }
        });
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
        if (this.unsubscribeFromStore) {
            this.unsubscribeFromStore();
            this.unsubscribeFromStore = null;
        }
        reconnectionStore.reset();
        
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
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        // Додаємо гравця в стор. Це автоматично відкриє модалку через підписку.
        reconnectionStore.addPlayer({ id: player.id, name: player.name });
    }

    private triggerReconnect(playerId: string): void {
        reconnectionStore.removePlayer(playerId);
    }

    // Метод для обробки оновлень кімнати з Firestore (як запасний варіант)
    public handleRoomUpdate(room: Room): void {
        if (room.status !== 'playing') return;

        const timeSinceStart = Date.now() - this.startedAt;
        if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) return;

        const players = Object.values(room.players);
        
        // Перевіряємо всіх гравців
        players.forEach(p => {
             if (p.id === this.config.myPlayerId) return;

             if (p.isDisconnected) {
                 const rtStatus = this.rtStatuses[p.id];
                 const isRtOnline = rtStatus && rtStatus.state === 'online';

                 if (!isRtOnline) {
                     this.triggerDisconnect(p.id, p.disconnectStartedAt || Date.now());
                 } else {
                     logService.GAME_MODE(`[Presence] Firestore says disconnected, but RTDB says online. Ignoring Firestore.`);
                     this.triggerReconnect(p.id);
                 }
             } else {
                 // Firestore says connected. Check RTDB just in case? 
                 // Ні, тут ми довіряємо Firestore або RTDB (вони повинні бути синхронізовані монітором).
                 // Але якщо ми раніше додали його в стор як offline, а тут він online, треба прибрати.
                 
                 // Але Firestore оновлюється повільно. RTDB швидше.
                 // Краще покладатися на RTDB колбек для повернення.
             }
        });
        
        // Також перевіряємо, чи є в сторі гравці, які вже повернулися за даними Firestore
        const state = get(reconnectionStore);
        state.players.forEach(p => {
            const roomPlayer = players.find(rp => rp.id === p.id);
            // Якщо в кімнаті гравець позначений як не disconnected і RTDB теж каже online (або немає даних)
            if (roomPlayer && !roomPlayer.isDisconnected) {
                 const rtStatus = this.rtStatuses[p.id];
                 const isRtOnline = rtStatus && rtStatus.state === 'online';
                 if (isRtOnline) {
                     this.triggerReconnect(p.id);
                 }
            }
        });
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
                const isRtOnline = rtStatus && rtStatus.state === 'online';
                
                // DEBUG: Логування прийняття рішення
                if (isRtOffline) {
                    logService.GAME_MODE(`[Presence] CHECK: ${player.name} | RT: Offline | TimeSinceSeen: ${timeSinceSeen}ms`);
                }

                if (!player.isDisconnected) {
                    // ГІПОТЕЗА: Якщо RTDB каже ONLINE, ми віримо їй більше, ніж Firestore lastSeen.
                    // Firestore може гальмувати, а RTDB (через presenceService) - це живий сокет.
                    if (isRtOnline) {
                        continue; // Skip checks, player is definitely here
                    }

                    // Вважаємо відключеним, якщо:
                    // 1. RTDB каже Offline (це найбільш надійний сигнал про закриття вкладки)
                    // 2. АБО пройшло дуже багато часу (DISCONNECT_THRESHOLD_MS = 60с) і немає сигналу RTDB (наприклад, RTDB теж відвалилась або не підключилась)
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
                    
                    // Він вважається повернутим, якщо RTDB каже online АБО оновився lastSeen
                    // (lastSeen оновлюється через heartbeat, тобто JS на клієнті працює)
                    if (isRtOnline || timeSinceSeen < (this.DISCONNECT_THRESHOLD_MS / 2)) { // Використовуємо менший поріг для повернення
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