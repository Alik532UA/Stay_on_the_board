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
    limit,
    deleteField,
    type DocumentData,
    type Unsubscribe,
    type DocumentReference
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseService';
import { logService } from './logService';
import type { Room, RoomSummary, OnlinePlayer } from '$lib/types/online';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import { defaultGameSettings } from '$lib/stores/gameSettingsStore';
import { v4 as uuidv4 } from 'uuid';

const ROOM_TIMEOUT_MS = 600000;
const OPERATION_TIMEOUT_MS = 10000;
const MAX_PLAYERS = 8;

export interface ChatMessage {
    id?: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(errorMsg));
        }, ms);
    });

    return Promise.race([
        promise.then((res) => {
            clearTimeout(timer);
            return res;
        }),
        timeoutPromise
    ]);
}

class RoomService {
    private get db() {
        return getFirestoreDb();
    }

    async createRoom(hostName: string, isPrivate: boolean = false, customRoomName?: string): Promise<string> {
        logService.init(`[RoomService] createRoom START. Host: ${hostName}`);

        const hostId = uuidv4();
        const initialPlayer: OnlinePlayer = {
            id: hostId,
            name: hostName,
            color: '#00bbf9',
            isReady: false,
            joinedAt: Date.now(),
            isOnline: true
        };

        const finalRoomName = customRoomName && customRoomName.trim() !== ""
            ? customRoomName.trim()
            : `Room #${Math.floor(Math.random() * 10000)}`;

        const roomData: Omit<Room, 'id'> = {
            name: finalRoomName,
            hostId: hostId,
            status: 'waiting',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isPrivate: isPrivate,
            settingsLocked: false,
            allowGuestSettings: false,
            gameState: null,
            players: {
                [hostId]: initialPlayer
            },
            settings: defaultGameSettings
        };

        try {
            const docRef = await withTimeout(
                addDoc(collection(this.db, 'rooms'), roomData),
                OPERATION_TIMEOUT_MS,
                'Timeout: Failed to connect to Firebase Firestore.'
            );
            logService.init(`[RoomService] addDoc SUCCESS. Room ID: ${docRef.id}`);
            this.saveSession(docRef.id, hostId);
            return docRef.id;
        } catch (error) {
            logService.error('[RoomService] Failed to create room:', error);
            throw error;
        }
    }

    async getPublicRooms(): Promise<RoomSummary[]> {
        try {
            const q = query(
                collection(this.db, 'rooms'),
                where('isPrivate', '==', false),
                orderBy('lastActivity', 'desc')
            );

            const querySnapshot = await withTimeout(
                getDocs(q),
                OPERATION_TIMEOUT_MS,
                'Timeout fetching rooms'
            );

            const rooms: RoomSummary[] = [];
            const now = Date.now();
            const cleanupPromises: Promise<void>[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as Room;
                if (now - data.lastActivity > ROOM_TIMEOUT_MS) {
                    cleanupPromises.push(deleteDoc(doc.ref));
                    return;
                }
                rooms.push({
                    id: doc.id,
                    name: data.name,
                    status: data.status,
                    playerCount: Object.keys(data.players || {}).length,
                    maxPlayers: MAX_PLAYERS,
                    isPrivate: data.isPrivate
                });
            });

            if (cleanupPromises.length > 0) {
                Promise.allSettled(cleanupPromises).catch(e => console.error(e));
            }

            return rooms;
        } catch (error) {
            logService.error('[RoomService] Failed to get rooms:', error);
            return [];
        }
    }

    async joinRoom(roomId: string, playerName: string): Promise<string> {
        logService.init(`[RoomService] joinRoom START. Room: ${roomId}`);
        const playerId = uuidv4();
        const roomRef = doc(this.db, 'rooms', roomId);

        try {
            const roomSnap = await withTimeout(
                getDoc(roomRef),
                OPERATION_TIMEOUT_MS,
                'Timeout connecting to room'
            );

            if (!roomSnap.exists()) {
                throw new Error('Room not found');
            }

            const roomData = roomSnap.data() as Room;
            const existingSession = this.getSession();

            if (existingSession.roomId === roomId && existingSession.playerId && roomData.players[existingSession.playerId]) {
                logService.init(`[RoomService] Reconnecting as existing player`);
                return existingSession.playerId;
            }

            if (Object.keys(roomData.players).length >= MAX_PLAYERS) {
                throw new Error('Room is full');
            }

            if (roomData.status === 'playing') {
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

            await withTimeout(
                updateDoc(roomRef, {
                    [`players.${playerId}`]: newPlayer,
                    lastActivity: Date.now()
                }),
                OPERATION_TIMEOUT_MS,
                'Timeout joining room'
            );

            this.saveSession(roomId, playerId);
            return playerId;
        } catch (error) {
            logService.error('[RoomService] Failed to join room:', error);
            throw error;
        }
    }

    async updatePlayer(roomId: string, playerId: string, data: Partial<OnlinePlayer>): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        const updates: Record<string, any> = { lastActivity: Date.now() };

        for (const [key, value] of Object.entries(data)) {
            updates[`players.${playerId}.${key}`] = value;
        }

        await updateDoc(roomRef, updates);
    }

    async getRoom(roomId: string): Promise<Room | null> {
        try {
            const roomRef = doc(this.db, 'rooms', roomId);
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
                return { ...roomSnap.data(), id: roomSnap.id } as Room;
            }
            return null;
        } catch (error) {
            logService.error('[RoomService] Failed to get room:', error);
            return null;
        }
    }

    subscribeToRoom(roomId: string, callback: (room: Room) => void): Unsubscribe {
        const roomRef = doc(this.db, 'rooms', roomId);
        return onSnapshot(roomRef, (doc) => {
            if (doc.exists()) {
                const roomData = doc.data() as Room;
                callback({ ...roomData, id: doc.id });
            } else {
                logService.init(`[RoomService] Room ${roomId} deleted`);
            }
        }, (error) => {
            logService.error('[RoomService] Subscribe error:', error);
        });
    }

    async updateRoomSettings(roomId: string, settings: Partial<GameSettingsState> & { allowGuestSettings?: boolean }): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        const updates: Record<string, any> = { lastActivity: Date.now() };

        for (const [key, value] of Object.entries(settings)) {
            if (key === 'allowGuestSettings') {
                updates['allowGuestSettings'] = value;
            } else {
                updates[`settings.${key}`] = value;
            }
        }

        if (settings.settingsLocked !== undefined) {
            updates['settingsLocked'] = settings.settingsLocked;
        }

        await updateDoc(roomRef, updates);
    }

    async sendMessage(roomId: string, senderId: string, senderName: string, text: string): Promise<void> {
        const messagesRef = collection(this.db, 'rooms', roomId, 'messages');
        await addDoc(messagesRef, {
            senderId,
            senderName,
            text,
            createdAt: serverTimestamp()
        });
    }

    subscribeToChat(roomId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
        const messagesRef = collection(this.db, 'rooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
        return onSnapshot(q, (snapshot) => {
            const messages: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                messages.push({
                    id: doc.id,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    text: data.text,
                    createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now()
                });
            });
            callback(messages);
        });
    }

    async leaveRoom(roomId: string, playerId: string): Promise<void> {
        logService.init(`[RoomService] Leaving room ${roomId} as ${playerId}`);
        const roomRef = doc(this.db, 'rooms', roomId);

        this.clearSession();

        try {
            const roomSnap = await getDoc(roomRef);
            if (!roomSnap.exists()) {
                logService.init(`[RoomService] Room ${roomId} does not exist, nothing to leave.`);
                return;
            }

            const roomData = roomSnap.data() as Room;
            const players = { ...roomData.players };

            if (players[playerId]) {
                delete players[playerId];

                if (Object.keys(players).length === 0) {
                    logService.init(`[RoomService] Room empty, deleting room.`);
                    await deleteDoc(roomRef);
                } else {
                    const updates: Record<string, any> = {
                        [`players.${playerId}`]: deleteField(),
                        lastActivity: Date.now()
                    };

                    if (roomData.hostId === playerId) {
                        const nextHostId = Object.keys(players)[0];
                        updates.hostId = nextHostId;
                        logService.init(`[RoomService] Host migrated to ${nextHostId}`);
                    }

                    const remainingPlayers = Object.values(players);
                    const allRemainingReady = remainingPlayers.length > 0 && remainingPlayers.every(p => p.isReady);

                    if (allRemainingReady && roomData.status === 'finished') {
                        updates.status = 'waiting';
                    }

                    await updateDoc(roomRef, updates);
                    logService.init(`[RoomService] Player removed atomically.`);
                }
            }
        } catch (error) {
            logService.error('[RoomService] Failed to leave room:', error);
        }
    }

    async toggleReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        await updateDoc(roomRef, {
            [`players.${playerId}.isReady`]: isReady,
            lastActivity: Date.now()
        });
    }

    async returnToLobby(roomId: string, playerId: string): Promise<void> {
        logService.init(`[RoomService] Player ${playerId} returning to lobby in room ${roomId}`);
        const roomRef = doc(this.db, 'rooms', roomId);

        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data() as Room;

        const updates: Record<string, any> = {
            [`players.${playerId}.isReady`]: true,
            lastActivity: Date.now()
        };

        const updatedPlayers = { ...roomData.players };
        if (updatedPlayers[playerId]) {
            updatedPlayers[playerId] = { ...updatedPlayers[playerId], isReady: true };
        }
        const allReady = Object.values(updatedPlayers).every(p => p.isReady);

        if (allReady) {
            updates['status'] = 'waiting';
        } else if (roomData.status === 'playing') {
            updates['status'] = 'finished';
        }

        await updateDoc(roomRef, updates);
    }

    async startGame(roomId: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);

        // Отримуємо поточний стан, щоб оновити всіх гравців
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data() as Room;
        const players = { ...roomData.players };

        // FIX: Скидаємо isReady для всіх гравців на початку гри
        Object.keys(players).forEach(id => {
            players[id].isReady = false;
        });

        await updateDoc(roomRef, {
            status: 'playing',
            gameState: null,
            players: players, // Оновлюємо гравців зі скинутим статусом
            lastActivity: Date.now()
        });
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