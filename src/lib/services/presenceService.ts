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

        onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                // Встановлюємо флаг відключення у Firestore, якщо з'єднання з RTDB було втрачено.
                // Це не onDisconnect, а реальна втрата зв'язку.
                roomFirestoreService.updatePresenceDoc(roomId, playerId, { isDisconnected: true });
                return;
            }

            // Якщо ми підключилися:
            const rtdbOnDisconnect = onDisconnect(userStatusDatabaseRef);
            
            // 1. Реєструємо дію "на випадок відключення" (onDisconnect)
            // Спочатку для RTDB
            rtdbOnDisconnect.set({
                state: 'offline',
                last_changed: serverTimestamp()
            }).then(() => {
                // Потім для Firestore
                roomFirestoreService.updatePresenceDoc(roomId, playerId, { isDisconnected: true });

                // 2. Встановлюємо поточний статус "online"
                // Спочатку для RTDB
                set(userStatusDatabaseRef, {
                    state: 'online',
                    last_changed: serverTimestamp()
                });
                // Потім для Firestore
                roomFirestoreService.updatePresenceDoc(roomId, playerId, { isDisconnected: false });
                
                logService.init(`[PresenceService] Tracking presence for ${playerId} in ${roomId}`);
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