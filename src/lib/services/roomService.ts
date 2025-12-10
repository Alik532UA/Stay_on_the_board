import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDoc,
    updateDoc,
    onSnapshot,
    type DocumentData,
    type Unsubscribe
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseService';
import { logService } from './logService';
import type { Room, RoomSummary, OnlinePlayer } from '$lib/types/online';
import { defaultGameSettings } from '$lib/stores/gameSettingsDefaults';
import { v4 as uuidv4 } from 'uuid';

// Час життя кімнати без активності (в мілісекундах)
const ROOM_TIMEOUT_MS = import.meta.env.DEV ? 10000 : 120000;

class RoomService {
    private get db() {
        return getFirestoreDb();
    }

    /**
     * Створює нову кімнату.
     */
    async createRoom(hostName: string, isPrivate: boolean = false): Promise<string> {
        const hostId = uuidv4();

        const initialPlayer: OnlinePlayer = {
            id: hostId,
            name: hostName,
            color: '#00bbf9',
            isReady: false,
            joinedAt: Date.now(),
            isOnline: true
        };

        const roomData: Omit<Room, 'id'> = {
            name: `Room #${Math.floor(Math.random() * 10000)}`,
            hostId: hostId,
            status: 'waiting',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isPrivate: isPrivate,
            settingsLocked: true,
            gameState: null,
            players: {
                [hostId]: initialPlayer
            },
            settings: defaultGameSettings
        };

        try {
            const docRef = await addDoc(collection(this.db, 'rooms'), roomData);
            logService.init(`[RoomService] Created room: ${docRef.id}`);
            this.saveSession(docRef.id, hostId);
            return docRef.id;
        } catch (error) {
            logService.error('[RoomService] Failed to create room:', error);
            throw error;
        }
    }

    /**
     * Отримує список публічних кімнат з "лінивим очищенням".
     */
    async getPublicRooms(): Promise<RoomSummary[]> {
        try {
            const q = query(
                collection(this.db, 'rooms'),
                where('isPrivate', '==', false),
                orderBy('lastActivity', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const rooms: RoomSummary[] = [];
            const now = Date.now();
            const cleanupPromises: Promise<void>[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as Room;

                if (now - data.lastActivity > ROOM_TIMEOUT_MS) {
                    logService.init(`[RoomService] Cleaning up dead room: ${doc.id}`);
                    cleanupPromises.push(deleteDoc(doc.ref));
                    return;
                }

                rooms.push({
                    id: doc.id,
                    name: data.name,
                    status: data.status,
                    playerCount: Object.keys(data.players || {}).length,
                    maxPlayers: 2,
                    isPrivate: data.isPrivate
                });
            });

            if (cleanupPromises.length > 0) {
                await Promise.allSettled(cleanupPromises);
            }

            return rooms;
        } catch (error) {
            logService.error('[RoomService] Failed to get rooms:', error);
            return [];
        }
    }

    /**
     * Приєднує гравця до кімнати.
     */
    async joinRoom(roomId: string, playerName: string): Promise<string> {
        const playerId = uuidv4();
        const roomRef = doc(this.db, 'rooms', roomId);

        try {
            const roomSnap = await getDoc(roomRef);
            if (!roomSnap.exists()) {
                throw new Error('Room not found');
            }

            const roomData = roomSnap.data() as Room;

            if (Object.keys(roomData.players).length >= 2) {
                throw new Error('Room is full');
            }
            if (roomData.status !== 'waiting') {
                throw new Error('Game already started');
            }

            const newPlayer: OnlinePlayer = {
                id: playerId,
                name: playerName,
                color: '#f4a261',
                isReady: false,
                joinedAt: Date.now(),
                isOnline: true
            };

            await updateDoc(roomRef, {
                [`players.${playerId}`]: newPlayer,
                lastActivity: Date.now()
            });

            this.saveSession(roomId, playerId);
            logService.init(`[RoomService] Joined room ${roomId} as ${playerId}`);

            return playerId;
        } catch (error) {
            logService.error('[RoomService] Failed to join room:', error);
            throw error;
        }
    }

    /**
     * Підписується на оновлення кімнати в реальному часі.
     */
    subscribeToRoom(roomId: string, callback: (room: Room) => void): Unsubscribe {
        const roomRef = doc(this.db, 'rooms', roomId);
        return onSnapshot(roomRef, (doc) => {
            if (doc.exists()) {
                const roomData = doc.data() as Room;
                // Додаємо ID до об'єкта, бо в data() його немає
                callback({ ...roomData, id: doc.id });
            } else {
                // Кімната видалена
                logService.init(`[RoomService] Room ${roomId} deleted`);
                // Можна передати null або спеціальний об'єкт, але поки що просто ігноруємо
            }
        }, (error) => {
            logService.error('[RoomService] Subscribe error:', error);
        });
    }

    /**
     * Вихід з кімнати.
     */
    async leaveRoom(roomId: string, playerId: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        try {
            // Видаляємо гравця зі списку
            // У Firestore видалення поля робиться через FieldValue.delete(), але тут ми оновлюємо весь об'єкт players
            // Простіше отримати поточний стан, видалити ключ і записати назад, або використати dot notation для видалення
            // Але для видалення поля вкладеного об'єкта потрібен спеціальний синтаксис.
            // Спростимо: читаємо -> модифікуємо -> пишемо (транзакція була б краще, але поки так)

            const roomSnap = await getDoc(roomRef);
            if (!roomSnap.exists()) return;

            const roomData = roomSnap.data() as Room;
            const players = { ...roomData.players };
            delete players[playerId];

            // Якщо гравців не залишилось, можна видалити кімнату або залишити на TTL
            // Якщо це був хост, треба передати права (реалізуємо пізніше)

            await updateDoc(roomRef, {
                players: players,
                lastActivity: Date.now()
            });

            this.clearSession();
        } catch (error) {
            logService.error('[RoomService] Failed to leave room:', error);
        }
    }

    /**
     * Перемикає стан готовності гравця.
     */
    async toggleReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        await updateDoc(roomRef, {
            [`players.${playerId}.isReady`]: isReady,
            lastActivity: Date.now()
        });
    }

    /**
     * Запускає гру (тільки хост).
     */
    async startGame(roomId: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        await updateDoc(roomRef, {
            status: 'playing',
            lastActivity: Date.now()
        });
    }

    async touchRoom(roomId: string): Promise<void> {
        try {
            const roomRef = doc(this.db, 'rooms', roomId);
            await updateDoc(roomRef, {
                lastActivity: Date.now()
            });
        } catch (error) {
            // Ignore heartbeat errors
        }
    }

    private saveSession(roomId: string, playerId: string) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('online_roomId', roomId);
            localStorage.setItem('online_playerId', playerId);
        }
    }

    getSession(): { roomId: string | null, playerId: string | null } {
        if (typeof localStorage !== 'undefined') {
            return {
                roomId: localStorage.getItem('online_roomId'),
                playerId: localStorage.getItem('online_playerId')
            };
        }
        return { roomId: null, playerId: null };
    }

    clearSession() {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('online_roomId');
            localStorage.removeItem('online_playerId');
        }
    }
}

export const roomService = new RoomService();