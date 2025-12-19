import { roomPlayerService } from "$lib/services/room/roomPlayerService";
import { logService } from "$lib/services/logService";
import type { OnlinePlayer } from "$lib/types/online";

type DisconnectHandler = (playerId: string, disconnectStartedAt: number) => void;
type ReconnectHandler = (playerId: string) => void;
type KickHandler = (playerId: string) => void;

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

    // Callbacks
    public onPlayerDisconnect: DisconnectHandler | null = null;
    public onPlayerReconnect: ReconnectHandler | null = null;

    constructor(private config: PresenceConfig) { }

    public start(): void {
        this.startHeartbeat();
        this.startMonitoring();
    }

    public stop(): void {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.monitorInterval) clearInterval(this.monitorInterval);
        this.heartbeatInterval = null;
        this.monitorInterval = null;
    }

    private startHeartbeat(): void {
        const send = async () => {
            try {
                await roomPlayerService.sendHeartbeat(this.config.roomId, this.config.myPlayerId);
            } catch (e) {
                // Silent fail for heartbeats is okay, will retry next time
                console.warn("[Presence] Heartbeat failed", e);
            }
        };

        // Send immediately then interval
        send();
        this.heartbeatInterval = setInterval(send, this.HEARTBEAT_MS);
    }

    private startMonitoring(): void {
        this.monitorInterval = setInterval(async () => {
            if (!this.config.isHost()) return; // Only host monitors presence

            const now = Date.now();
            const players = this.config.getPlayers();

            for (const player of players) {
                // Skip self
                if (player.id === this.config.myPlayerId) continue;

                // Checking only online players who are not yet marked as disconnected
                // OR checking disconnected players to see if they should be kicked

                const lastSeen = player.lastSeen || player.joinedAt; // Fallback to joinedAt
                const timeSinceSeen = now - lastSeen;

                if (!player.isDisconnected) {
                    // Check if should be marked disconnected
                    if (timeSinceSeen > this.DISCONNECT_THRESHOLD_MS) {
                        logService.init(`[Presence] Player ${player.name} timed out. Marking disconnected.`);

                        await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                            isDisconnected: true,
                            disconnectStartedAt: now
                        });
                    }
                } else {
                    // Already disconnected
                    // 1. Check if they came back (updatePlayer handles this implicitly? No, we need to detect lastSeen update)
                    if (timeSinceSeen < this.DISCONNECT_THRESHOLD_MS) {
                        logService.init(`[Presence] Player ${player.name} returned!`);
                        await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                            isDisconnected: false,
                            disconnectStartedAt: undefined
                        });
                    }
                    // 2. Check if kick timeout expired
                    else if (player.disconnectStartedAt && (now - player.disconnectStartedAt > this.KICK_TIMEOUT_MS)) {
                        logService.init(`[Presence] Player ${player.name} kick timer expired. Kicking.`);
                        await roomPlayerService.leaveRoom(this.config.roomId, player.id);
                    }
                }
            }
        }, this.MONITOR_MS);
    }
}
