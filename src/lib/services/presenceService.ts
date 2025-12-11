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
     * Автоматично встановлює статус 'offline' при розриві з'єднання.
     */
    trackPresence(roomId: string, playerId: string) {
        const userStatusDatabaseRef = ref(this.rtdb, `/status/${roomId}/${playerId}`);

        // Спеціальне посилання Firebase, яке показує статус з'єднання клієнта з сервером
        const connectedRef = ref(this.rtdb, '.info/connected');

        onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                return;
            }

            // Якщо ми підключилися:
            // 1. Реєструємо дію "на випадок відключення" (onDisconnect)
            onDisconnect(userStatusDatabaseRef).set({
                state: 'offline',
                last_changed: serverTimestamp()
            }).then(() => {
                // 2. Встановлюємо поточний статус "online"
                set(userStatusDatabaseRef, {
                    state: 'online',
                    last_changed: serverTimestamp()
                });
                logService.init(`[PresenceService] Tracking presence for ${playerId} in ${roomId}`);
            });
        });
    }

    /**
     * Встановлює статус офлайн вручну (наприклад, при виході з кімнати).
     */
    async setOffline(roomId: string, playerId: string) {
        const userStatusDatabaseRef = ref(this.rtdb, `/status/${roomId}/${playerId}`);
        await set(userStatusDatabaseRef, {
            state: 'offline',
            last_changed: serverTimestamp()
        });
    }
}

export const presenceService = new PresenceService();