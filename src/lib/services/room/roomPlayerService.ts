import { doc, updateDoc, getDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { getFirestoreDb } from '$lib/services/firebaseService';
import { logService } from '$lib/services/logService';
import type { OnlinePlayer, Room } from '$lib/types/online';
import { roomSessionService } from './roomSessionService';

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
    }

    async toggleReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        await updateDoc(roomRef, {
            [`players.${playerId}.isReady`]: isReady,
            lastActivity: Date.now()
        });
    }

    async setWatchingReplay(roomId: string, playerId: string, isWatching: boolean): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        await updateDoc(roomRef, {
            [`players.${playerId}.isWatchingReplay`]: isWatching,
            lastActivity: Date.now()
        });
    }

    async sendHeartbeat(roomId: string, playerId: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        // Ми не оновлюємо глобальне lastActivity, щоб не тригерити зайві ререндери списку кімнат
        // якщо це не потрібно. Але для простоти поки оновлюємо тільки lastSeen.
        await updateDoc(roomRef, {
            [`players.${playerId}.lastSeen`]: Date.now()
        });
    }

    async leaveRoom(roomId: string, playerId: string): Promise<void> {
        logService.init(`[RoomPlayerService] Leaving room ${roomId} as ${playerId}`);
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

                if (Object.keys(players).length === 0) {
                    logService.init(`[RoomPlayerService] Room empty, deleting room.`);
                    await deleteDoc(roomRef);
                } else {
                    const updates: Record<string, any> = {
                        [`players.${playerId}`]: deleteField(),
                        lastActivity: Date.now()
                    };

                    if (roomData.hostId === playerId) {
                        const nextHostId = Object.keys(players)[0];
                        updates.hostId = nextHostId;
                        logService.init(`[RoomPlayerService] Host migrated to ${nextHostId}`);
                    }

                    const remainingPlayers = Object.values(players);
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