import { roomPlayerService } from "$lib/services/room/roomPlayerService";
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

    // Config constants
    private readonly HEARTBEAT_MS = 5000;
    private readonly MONITOR_MS = 2000;
    private readonly DISCONNECT_THRESHOLD_MS = 15000;
    private readonly KICK_TIMEOUT_MS = 30000;

    public onPlayerDisconnect: DisconnectHandler | null = null;
    public onPlayerReconnect: ReconnectHandler | null = null;

    constructor(private config: PresenceConfig) { }

    public start(): void {
        this.startHeartbeat();
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
    }

    // Новий метод для обробки оновлень кімнати (для клієнтів і хоста)
    public handleRoomUpdate(room: Room): void {
        if (room.status !== 'playing') return;

        const players = Object.values(room.players);
        const disconnectedPlayer = players.find(p => p.isDisconnected && p.id !== this.config.myPlayerId);
        const currentModal = get(modalStore);

        if (disconnectedPlayer) {
            if (!currentModal.isOpen || currentModal.dataTestId !== 'reconnection-modal') {
                logService.init(`[PresenceManager] Player ${disconnectedPlayer.name} disconnected. Pausing game.`);
                timeService.pauseTurnTimer();

                modalStore.showModal({
                    component: ReconnectionModal,
                    variant: 'menu',
                    dataTestId: 'reconnection-modal',
                    props: {
                        playerName: disconnectedPlayer.name,
                        disconnectStartedAt: disconnectedPlayer.disconnectStartedAt || Date.now(),
                        roomId: this.config.roomId,
                        myPlayerId: this.config.myPlayerId
                    },
                    closable: false,
                    closeOnOverlayClick: false
                });
            }
        } else {
            if (currentModal.isOpen && currentModal.dataTestId === 'reconnection-modal') {
                logService.init(`[PresenceManager] All players connected. Resuming game.`);
                modalStore.closeModal();
                timeService.resumeTurnTimer();
            }
        }
    }

    private startHeartbeat(): void {
        const send = async () => {
            if (!this.heartbeatInterval) return;

            try {
                await roomPlayerService.sendHeartbeat(this.config.roomId, this.config.myPlayerId);
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
        this.monitorInterval = setInterval(async () => {
            if (!this.config.isHost()) return;

            const now = Date.now();
            const players = this.config.getPlayers();

            for (const player of players) {
                if (player.id === this.config.myPlayerId) continue;

                const lastSeen = player.lastSeen || player.joinedAt;
                const timeSinceSeen = now - lastSeen;

                if (!player.isDisconnected) {
                    if (timeSinceSeen > this.DISCONNECT_THRESHOLD_MS) {
                        logService.init(`[Presence] Player ${player.name} timed out (${Math.round(timeSinceSeen / 1000)}s). Marking disconnected.`);

                        try {
                            await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                                isDisconnected: true,
                                disconnectStartedAt: now
                            });
                        } catch (e) { }
                    }
                } else {
                    if (timeSinceSeen < this.DISCONNECT_THRESHOLD_MS) {
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