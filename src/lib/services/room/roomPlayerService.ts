import { doc, updateDoc, getDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { getFirestoreDb } from '$lib/services/firebaseService';
import { logService } from '$lib/services/logService';
import type { OnlinePlayer, Room } from '$lib/types/online';
import { roomSessionService } from './roomSessionService';
import { networkStatsStore } from '$lib/stores/networkStatsStore';

export class RoomPlayerService {
    private get db() {
        return getFirestoreDb();
    }

    async updatePlayer(roomId: string, playerId: string, data: Partial<OnlinePlayer>): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        const updates: Record<string, any> = { lastActivity: Date.now() };

        for (const [key, value] of Object.entries(data)) {
            updates[`players.${playerId}.${key}`] = value;
        }

        await updateDoc(roomRef, updates);
        networkStatsStore.recordWrite('RoomPlayer:updatePlayer', updates);
    }

    async toggleReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        const updates = {
            [`players.${playerId}.isReady`]: isReady,
            lastActivity: Date.now()
        };
        await updateDoc(roomRef, updates);
        networkStatsStore.recordWrite('RoomPlayer:toggleReady', updates);
    }

    async setWatchingReplay(roomId: string, playerId: string, isWatching: boolean): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        const updates = {
            [`players.${playerId}.isWatchingReplay`]: isWatching,
            lastActivity: Date.now()
        };
        await updateDoc(roomRef, updates);
        networkStatsStore.recordWrite('RoomPlayer:setWatchingReplay', updates);
    }

    async sendHeartbeat(roomId: string, playerId: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        // Ми не оновлюємо глобальне lastActivity, щоб не тригерити зайві ререндери списку кімнат
        // якщо це не потрібно. Але для простоти поки оновлюємо тільки lastSeen.
        const updates = {
            [`players.${playerId}.lastSeen`]: Date.now()
        };
        await updateDoc(roomRef, updates);
        networkStatsStore.recordWrite('RoomPlayer:Heartbeat', updates);
    }

    async leaveRoom(roomId: string, playerId: string): Promise<void> {
        logService.init(`[RoomPlayerService] leaveRoom CALLED for ${roomId} by ${playerId}`);
        const roomRef = doc(this.db, 'rooms', roomId);

        roomSessionService.clearSession();

        try {
            const roomSnap = await getDoc(roomRef);
            if (!roomSnap.exists()) {
                logService.init(`[RoomPlayerService] Room ${roomId} does not exist.`);
                return;
            }

            const roomData = roomSnap.data() as Room;
            const players = { ...roomData.players };

            if (players[playerId]) {
                delete players[playerId];
                logService.init(`[RoomPlayerService] Removed player from map. Checking remaining...`);

                const remainingPlayers = Object.values(players);
                const activePlayers = remainingPlayers.filter(p => !p.isDisconnected);
                
                logService.init(`[RoomPlayerService] Remaining: ${remainingPlayers.length}, Active: ${activePlayers.length}`);

                if (remainingPlayers.length === 0) {
                    logService.init(`[RoomPlayerService] Room empty, deleting room.`);
                    await deleteDoc(roomRef);
                } else {
                    const updates: Record<string, any> = {
                        [`players.${playerId}`]: deleteField(),
                        lastActivity: Date.now()
                    };

                    if (roomData.hostId === playerId) {
                        // Шукаємо нового хоста серед активних гравців, або беремо будь-кого, хто залишився
                        const nextHost = activePlayers[0] || remainingPlayers[0];
                        if (nextHost) {
                             updates.hostId = nextHost.id;
                             logService.init(`[RoomPlayerService] Host migrated to ${nextHost.id}`);
                        }
                    }

                    const allRemainingReady = remainingPlayers.length > 0 && remainingPlayers.every(p => p.isReady);

                    if (allRemainingReady && roomData.status === 'finished') {
                        updates.status = 'waiting';
                    }

                    await updateDoc(roomRef, updates);
                }
            }
        } catch (error) {
            logService.error('[RoomPlayerService] Failed to leave room:', error);
        }
    }
}

export const roomPlayerService = new RoomPlayerService();