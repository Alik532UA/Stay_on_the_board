import { roomPlayerService } from "$lib/services/room/roomPlayerService";
import { logService } from "$lib/services/logService";
import type { OnlinePlayer } from "$lib/types/online";

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

    // Час без активності, після якого гравець вважається "відключеним" (показ модалки)
    private readonly DISCONNECT_THRESHOLD_MS = 15000;

    // Час після початку відключення, через який гравця видаляють з кімнати
    private readonly KICK_TIMEOUT_MS = 30000;

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
                console.warn("[Presence] Heartbeat failed", e);
            }
        };

        send();
        this.heartbeatInterval = setInterval(send, this.HEARTBEAT_MS);
    }

    private startMonitoring(): void {
        this.monitorInterval = setInterval(async () => {
            if (!this.config.isHost()) return; // Тільки Хост моніторить стан інших

            const now = Date.now();
            const players = this.config.getPlayers();

            for (const player of players) {
                // Не перевіряємо себе
                if (player.id === this.config.myPlayerId) continue;

                const lastSeen = player.lastSeen || player.joinedAt;
                const timeSinceSeen = now - lastSeen;

                if (!player.isDisconnected) {
                    // 1. Виявлення відключення
                    if (timeSinceSeen > this.DISCONNECT_THRESHOLD_MS) {
                        logService.init(`[Presence] Player ${player.name} timed out (${Math.round(timeSinceSeen / 1000)}s). Marking disconnected.`);

                        await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                            isDisconnected: true,
                            disconnectStartedAt: now
                        });
                    }
                } else {
                    // 2. Перевірка на повернення
                    if (timeSinceSeen < this.DISCONNECT_THRESHOLD_MS) {
                        logService.init(`[Presence] Player ${player.name} returned! Removing disconnected flag.`);
                        await roomPlayerService.updatePlayer(this.config.roomId, player.id, {
                            isDisconnected: false,
                            disconnectStartedAt: undefined
                        });
                    }
                    // 3. Перевірка на тайм-аут кіку
                    else if (player.disconnectStartedAt && (now - player.disconnectStartedAt > this.KICK_TIMEOUT_MS)) {
                        logService.init(`[Presence] Player ${player.name} kick timer expired (>30s). Kicking from room.`);
                        await roomPlayerService.leaveRoom(this.config.roomId, player.id);
                    }
                }
            }
        }, this.MONITOR_MS);
    }
}