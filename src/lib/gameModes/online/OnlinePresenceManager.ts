import { roomFirestoreService } from "$lib/services/room/roomFirestoreService";
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
    private presenceStatuses: Record<string, { state: string, last_changed: number }> = {};

    // Config constants
    private readonly HEARTBEAT_MS = 25000;
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
            const isGameOver = get(uiStateStore).isGameOver;

            if (isGameOver) {
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
        logService.presence(`[Presence] Starting... Grace period of ${this.PRESENCE_GRACE_PERIOD_MS}ms is active.`);
        this.startHeartbeat();
        this.startRealtimePresence();

        // Після закінчення пільгового періоду, просто логуємо це
        setTimeout(() => {
            logService.presence('[Presence] Grace period ended. Real-time presence checks are now active.');
        }, this.PRESENCE_GRACE_PERIOD_MS);
    }

    public stop(): void {
    // ...
    }

    private startRealtimePresence(): void {
        // ... (trackPresence call)

        this.unsubscribeFromRtdb = roomFirestoreService.subscribeToPresence(
            this.config.roomId,
            (statuses) => {
                const timeSinceStart = Date.now() - this.startedAt;
                if (timeSinceStart < this.PRESENCE_GRACE_PERIOD_MS) {
                    logService.presence('[Presence] Skipping real-time check during grace period.');
                    return;
                }
                
                const newStatuses: Record<string, { state: string, last_changed: number }> = {};
                
                Object.entries(statuses).forEach(([playerId, data]) => {
                    const isOnline = !data.isDisconnected && (Date.now() - (data.lastSeen || 0) < 15000); // 15 сек толерантність
                    
                    newStatuses[playerId] = {
                        state: isOnline ? 'online' : 'offline',
                        last_changed: data.updatedAt || Date.now()
                    };
                });

                this.presenceStatuses = newStatuses;
                // logService.GAME_MODE(`[Presence] Firestore Presence Update: ${JSON.stringify(newStatuses)}`);

                // МИТТЄВА РЕАКЦІЯ: Якщо суперник став offline, додаємо в стор
                Object.entries(newStatuses).forEach(([playerId, status]) => {
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
    // ...
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
                 const presenceStatus = this.presenceStatuses[p.id];
                 const isPresenceOnline = presenceStatus && presenceStatus.state === 'online';

                 if (!isPresenceOnline) {
                     this.triggerDisconnect(p.id, p.disconnectStartedAt || Date.now());
                 } else {
                     logService.presence(`[Presence] Main doc says disconnected, but Presence subcollection says online for ${p.name}. Trusting Presence subcollection.`);
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
                 const presenceStatus = this.presenceStatuses[p.id];
                 const isPresenceOnline = presenceStatus && presenceStatus.state === 'online';
                 if (isPresenceOnline) {
                     this.triggerReconnect(p.id);
                 }
            }
        });
    }

    private startHeartbeat(): void {
        logService.presence(`[PresenceManager] Starting heartbeat for player ${this.config.myPlayerId}`);
        
        const send = async () => {
            if (!this.heartbeatInterval) return;

            try {
                // Fast Heartbeat (every 25s) -> Presence Subcollection
                await roomPlayerService.sendHeartbeat(this.config.roomId, this.config.myPlayerId);
            } catch (e: any) {
                if (e.code === 'not-found' || e.message?.includes('No document to update')) {
                    logService.presence(`[Presence] Room ${this.config.roomId} not found. Stopping heartbeat.`);
                    this.stop();
                } else {
                    console.warn("[Presence] Heartbeat failed", e);
                }
            }
        };

        send();
        this.heartbeatInterval = setInterval(send, this.HEARTBEAT_MS);
    }


}