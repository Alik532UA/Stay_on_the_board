import { roomFirestoreService } from './room/roomFirestoreService';
import {
    ref,
    onValue,
    onDisconnect,
    set,
    serverTimestamp,
    type Database
} from 'firebase/database';
import { getRealtimeDb } from './firebaseService';
import { logService } from './logService';

class PresenceService {
    private get rtdb(): Database {
        return getRealtimeDb();
    }

    /**
     * Починає відстеження присутності гравця в кімнаті.
     * Автоматично встановлює статус 'offline' при розриві з'єднання в RTDB та Firestore.
     */
    trackPresence(roomId: string, playerId: string) {
        const userStatusDatabaseRef = ref(this.rtdb, `/status/${roomId}/${playerId}`);
        const connectedRef = ref(this.rtdb, '.info/connected');

        logService.init(`[PresenceService] Setting up presence tracking for ${playerId} in ${roomId}`);

        onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                // З'єднання з RTDB було втрачено - встановлюємо флаг відключення у Firestore
                logService.presence(`[PresenceService] RTDB connection lost for ${playerId}. Setting disconnected in Firestore.`);
                roomFirestoreService.updatePresenceDoc(roomId, playerId, { isDisconnected: true });
                return;
            }

            logService.presence(`[PresenceService] RTDB connected for ${playerId}. Setting up onDisconnect and online status.`);

            // Якщо ми підключилися:
            const rtdbOnDisconnect = onDisconnect(userStatusDatabaseRef);

            // 1. Реєструємо дію "на випадок відключення" (onDisconnect) для RTDB
            // Ця операція буде виконана Firebase сервером коли клієнт відключиться
            rtdbOnDisconnect.set({
                state: 'offline',
                last_changed: serverTimestamp()
            }).then(() => {
                // onDisconnect зареєстровано успішно
                // Тепер встановлюємо поточний статус "online"

                // RTDB online
                set(userStatusDatabaseRef, {
                    state: 'online',
                    last_changed: serverTimestamp()
                });

                // Firestore online (одразу, бо ми зараз online)
                roomFirestoreService.updatePresenceDoc(roomId, playerId, {
                    isDisconnected: false,
                    lastSeen: Date.now()
                });

                logService.presence(`[PresenceService] Presence tracking active for ${playerId}`);
            });
        });
    }

    /**
     * Встановлює статус офлайн вручну (наприклад, при виході з кімнати).
     */
    async setOffline(roomId: string, playerId: string) {
        const userStatusDatabaseRef = ref(this.rtdb, `/status/${roomId}/${playerId}`);
        // Оновлюємо RTDB
        await set(userStatusDatabaseRef, {
            state: 'offline',
            last_changed: serverTimestamp()
        });
        // Оновлюємо Firestore
        await roomFirestoreService.updatePresenceDoc(roomId, playerId, { isDisconnected: true });
    }

    /**
     * Підписується на зміни статусів всіх гравців у кімнаті.
     */
    subscribeToRoomPresence(roomId: string, callback: (statuses: Record<string, { state: string, last_changed: number }>) => void): () => void {
        const roomStatusRef = ref(this.rtdb, `/status/${roomId}`);

        const unsubscribe = onValue(roomStatusRef, (snapshot) => {
            const val = snapshot.val();
            callback(val || {});
        });

        return unsubscribe;
    }
}

export const presenceService = new PresenceService();