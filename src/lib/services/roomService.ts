import {
    collection,
    setDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDoc,
    updateDoc,
    onSnapshot,
    type Unsubscribe
} from 'firebase/firestore';
import { getFirestoreDb } from './firebaseService';
import { logService } from './logService';
import type { Room, RoomSummary, OnlinePlayer } from '$lib/types/online';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import { defaultGameSettings } from '$lib/stores/gameSettingsStore';
import { v4 as uuidv4 } from 'uuid';
import { chatService, type ChatMessage } from './chatService';
import { withTimeout } from '$lib/utils/asyncUtils';
import { roomSessionService } from './room/roomSessionService';
import { roomPlayerService } from './room/roomPlayerService';
import { generateRandomRoomName } from '$lib/utils/nameGenerator';
import { getRandomUnusedColor } from '$lib/utils/playerUtils'; // Додано імпорт

const ROOM_TIMEOUT_MS = 600000;
const OPERATION_TIMEOUT_MS = 10000;
const MAX_PLAYERS = 8;

export type { ChatMessage };

class RoomService {
    private get db() {
        return getFirestoreDb();
    }

    // --- Room CRUD ---

    async createRoom(hostName: string, isPrivate: boolean = false, customRoomName?: string): Promise<string> {
        logService.init(`[RoomService] createRoom START. Host: ${hostName}`);

        const hostId = uuidv4();

        // Генеруємо випадковий колір для хоста (список використаних кольорів порожній)
        const hostColor = getRandomUnusedColor([]);

        const initialPlayer: OnlinePlayer = {
            id: hostId,
            name: hostName,
            color: hostColor, // Використовуємо випадковий колір
            isReady: false,
            joinedAt: Date.now(),
            isOnline: true,
            isWatchingReplay: false
        };

        const finalRoomName = customRoomName && customRoomName.trim() !== ""
            ? customRoomName.trim()
            : generateRandomRoomName();

        const onlineDefaultSettings: GameSettingsState = {
            ...defaultGameSettings,
            boardSize: 2,
            turnDuration: 1000,
            autoHideBoard: false,
            blockModeEnabled: true,
            settingsLocked: false,
        };

        const roomData: Omit<Room, 'id'> = {
            name: finalRoomName,
            hostId: hostId,
            status: 'waiting',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isPrivate: isPrivate,
            settingsLocked: false,
            allowGuestSettings: true,
            gameState: null,
            players: { [hostId]: initialPlayer },
            settings: onlineDefaultSettings
        };

        try {
            const roomId = this.generateTimestampId();
            const roomRef = doc(this.db, 'rooms', roomId);

            await withTimeout(
                setDoc(roomRef, roomData),
                OPERATION_TIMEOUT_MS,
                'Timeout: Failed to connect to Firebase Firestore.'
            );

            roomSessionService.saveSession(roomId, hostId);
            return roomId;
        } catch (error) {
            logService.error('[RoomService] Failed to create room:', error);
            throw error;
        }
    }

    private generateTimestampId(): string {
        const now = new Date();
        const pad = (num: number) => num.toString().padStart(2, '0');
        const padMs = (num: number) => num.toString().padStart(3, '0');

        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());
        const ms = padMs(now.getMilliseconds());

        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}_${ms}_${randomSuffix}`;
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

            if (!roomSnap.exists()) throw new Error('Room not found');

            const roomData = roomSnap.data() as Room;
            const existingSession = roomSessionService.getSession();

            if (existingSession.roomId === roomId && existingSession.playerId && roomData.players[existingSession.playerId]) {
                logService.init(`[RoomService] Reconnecting as existing player`);
                if (roomData.players[existingSession.playerId].name !== playerName) {
                    await updateDoc(roomRef, {
                        [`players.${existingSession.playerId}.name`]: playerName,
                        lastActivity: Date.now()
                    });
                }
                return existingSession.playerId;
            }

            if (Object.keys(roomData.players).length >= MAX_PLAYERS) throw new Error('Room is full');
            if (roomData.status === 'playing') throw new Error('Game already started');

            // Отримуємо список вже зайнятих кольорів
            const usedColors = Object.values(roomData.players).map(p => p.color);
            // Генеруємо унікальний колір для нового гравця
            const playerColor = getRandomUnusedColor(usedColors);

            const newPlayer: OnlinePlayer = {
                id: playerId,
                name: playerName,
                color: playerColor, // Використовуємо випадковий унікальний колір
                isReady: false,
                joinedAt: Date.now(),
                isOnline: true,
                isWatchingReplay: false
            };

            await withTimeout(
                updateDoc(roomRef, {
                    [`players.${playerId}`]: newPlayer,
                    lastActivity: Date.now()
                }),
                OPERATION_TIMEOUT_MS,
                'Timeout joining room'
            );

            roomSessionService.saveSession(roomId, playerId);
            return playerId;
        } catch (error) {
            logService.error('[RoomService] Failed to join room:', error);
            throw error;
        }
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
                callback({ ...doc.data(), id: doc.id } as Room);
            } else {
                logService.init(`[RoomService] Room ${roomId} deleted`);
            }
        }, (error) => {
            logService.error('[RoomService] Subscribe error:', error);
        });
    }

    // --- Game Flow ---

    async startGame(roomId: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data() as Room;
        const players = { ...roomData.players };

        Object.keys(players).forEach(id => {
            players[id].isReady = false;
            players[id].isWatchingReplay = false;
        });

        await updateDoc(roomRef, {
            status: 'playing',
            gameState: null,
            players: players,
            lastActivity: Date.now()
        });
    }

    async returnToLobby(roomId: string, playerId: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data() as Room;
        const updates: Record<string, any> = {
            [`players.${playerId}.isReady`]: true,
            [`players.${playerId}.isWatchingReplay`]: false,
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

    async renameRoom(roomId: string, newName: string): Promise<void> {
        const roomRef = doc(this.db, 'rooms', roomId);
        await updateDoc(roomRef, {
            name: newName,
            lastActivity: Date.now()
        });
    }

    // --- Delegations ---

    getSession = roomSessionService.getSession.bind(roomSessionService);
    clearSession = roomSessionService.clearSession.bind(roomSessionService);
    updatePlayer = roomPlayerService.updatePlayer.bind(roomPlayerService);
    toggleReady = roomPlayerService.toggleReady.bind(roomPlayerService);
    setWatchingReplay = roomPlayerService.setWatchingReplay.bind(roomPlayerService);
    leaveRoom = roomPlayerService.leaveRoom.bind(roomPlayerService);
    sendMessage = chatService.sendMessage.bind(chatService);
    subscribeToChat = chatService.subscribeToChat.bind(chatService);
}

export const roomService = new RoomService();