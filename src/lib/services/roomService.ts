import { logService } from './logService';
import type { Room, RoomSummary, OnlinePlayer } from '$lib/types/online';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import { defaultGameSettings } from '$lib/stores/gameSettingsStore';
import { v4 as uuidv4 } from 'uuid';
import { chatService, type ChatMessage } from './chatService';
import { roomSessionService } from './room/roomSessionService';
import { roomPlayerService } from './room/roomPlayerService';
import { generateRandomRoomName } from '$lib/utils/nameGenerator';
import { getRandomUnusedColor } from '$lib/utils/playerUtils';
import { roomFirestoreService } from './room/roomFirestoreService';
import type { Unsubscribe } from 'firebase/firestore';
import { errorHandlerService } from './errorHandlerService';

const ROOM_TIMEOUT_MS = 600000;
const MAX_PLAYERS = 8;

export type { ChatMessage };

class RoomService {

    // --- Room CRUD ---

    async createRoom(hostName: string, isPrivate: boolean = false, customRoomName?: string): Promise<string> {
        logService.init(`[RoomService] createRoom START. Host: ${hostName}`);

        const hostId = uuidv4();
        const hostColor = getRandomUnusedColor([]);

        const initialPlayer: OnlinePlayer = {
            id: hostId,
            name: hostName,
            color: hostColor,
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

            await roomFirestoreService.createRoomDoc(roomId, roomData);

            if (!isPrivate) {
                // FIX: Виправлення TS7011 через catch у самому сервісі або тут
                roomFirestoreService.updateStatsDoc({ lastRoomCreatedAt: Date.now() })
                    .catch((e: any) => console.warn('Failed to update global stats', e));
            }

            roomSessionService.saveSession(roomId, hostId);
            return roomId;
        } catch (error) {
            errorHandlerService.handle(error, { context: 'RoomService:CreateRoom' });
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

    private processRoomsSnapshot(querySnapshot: any): { rooms: RoomSummary[], latestCreatedAt?: number } {
        const rooms: RoomSummary[] = [];
        const now = Date.now();
        const cleanupPromises: Promise<void>[] = [];
        let activeRoomsLatestCreated = 0;

        querySnapshot.forEach((doc: any) => {
            const data = doc.data() as Room;

            if (data.createdAt > activeRoomsLatestCreated) {
                activeRoomsLatestCreated = data.createdAt;
            }

            if (now - data.lastActivity > ROOM_TIMEOUT_MS) {
                cleanupPromises.push(roomFirestoreService.deleteRoomDoc(doc.ref));
                return;
            }
            
            const allPlayers = Object.values(data.players || {});
            
            const activePlayers = allPlayers.filter(p => {
                const lastSeen = p.lastSeen || p.joinedAt;
                const isNotStale = (now - lastSeen) < 120000; 
                return !p.isDisconnected && isNotStale;
            });
            
            if (data.status === 'playing' && activePlayers.length === 0) {
                 // logService.init(`[RoomService] Hiding zombie room ${data.name} (playing, 0 active players).`);
                 return;
            }

            if (allPlayers.length > 0) {
                rooms.push({
                    id: doc.id,
                    name: data.name,
                    status: data.status,
                    playerCount: allPlayers.length,
                    maxPlayers: MAX_PLAYERS,
                    isPrivate: data.isPrivate
                });
            }
        });

        if (cleanupPromises.length > 0) {
            Promise.allSettled(cleanupPromises).catch(e => console.error(e));
        }

        return {
            rooms,
            latestCreatedAt: activeRoomsLatestCreated > 0 ? activeRoomsLatestCreated : undefined
        };
    }

    async getPublicRooms(): Promise<{ rooms: RoomSummary[], latestCreatedAt?: number }> {
        try {
            const [querySnapshot, statsData] = await roomFirestoreService.getPublicRoomsQuerySnapshot();
            const result = this.processRoomsSnapshot(querySnapshot);
            
            let globalLastCreated = statsData?.lastRoomCreatedAt || 0;
            const finalLatestCreatedAt = Math.max(result.latestCreatedAt || 0, globalLastCreated);

            return {
                rooms: result.rooms,
                latestCreatedAt: finalLatestCreatedAt > 0 ? finalLatestCreatedAt : undefined
            };
        } catch (error) {
            errorHandlerService.handle(error, { context: 'RoomService:GetPublicRooms', showToast: false });
            return { rooms: [] };
        }
    }

    subscribeToPublicRooms(callback: (data: { rooms: RoomSummary[], latestCreatedAt?: number }) => void): Unsubscribe {
        return roomFirestoreService.subscribeToPublicRooms(
            (snapshot) => {
                const result = this.processRoomsSnapshot(snapshot);
                callback(result);
            },
            (error) => {
                errorHandlerService.handle(error, { context: 'RoomService:SubscribePublicRooms', showToast: false });
                callback({ rooms: [] });
            }
        );
    }

    async joinRoom(roomId: string, playerName: string): Promise<string> {
        logService.init(`[RoomService] joinRoom START. Room: ${roomId}`);
        const playerId = uuidv4();

        try {
            const roomData = await roomFirestoreService.getRoomDoc(roomId);

            if (!roomData) throw new Error('Room not found');

            const existingSession = roomSessionService.getSession();

            if (existingSession.roomId === roomId && existingSession.playerId && roomData.players[existingSession.playerId]) {
                // Перевірка: чи є сенс повертатися?
                const otherPlayers = Object.values(roomData.players).filter(p => p.id !== existingSession.playerId);
                
                // Якщо гра йде/завершена, але я єдиний в списку гравців - значить всі інші вийшли остаточно.
                if (roomData.status !== 'waiting' && otherPlayers.length === 0) {
                     logService.init(`[RoomService] Reconnect aborted: Room is empty (only me left) and game started/finished.`);
                     roomSessionService.clearSession();
                     // Можна також викликати leaveRoom, щоб почистити за собою, але це не обов'язково
                     await roomPlayerService.leaveRoom(roomId, existingSession.playerId);
                     throw new Error('Game ended because all opponents left.');
                }

                logService.init(`[RoomService] Reconnecting as existing player`);
                if (roomData.players[existingSession.playerId].name !== playerName) {
                    await roomFirestoreService.updateRoomDoc(roomId, {
                        [`players.${existingSession.playerId}.name`]: playerName,
                        lastActivity: Date.now()
                    });
                }
                return existingSession.playerId;
            }

            if (Object.keys(roomData.players).length >= MAX_PLAYERS) throw new Error('Room is full');
            if (roomData.status === 'playing') throw new Error('Game already started');

            const usedColors = Object.values(roomData.players).map(p => p.color);
            const playerColor = getRandomUnusedColor(usedColors);

            const newPlayer: OnlinePlayer = {
                id: playerId,
                name: playerName,
                color: playerColor,
                isReady: false,
                joinedAt: Date.now(),
                isOnline: true,
                isWatchingReplay: false
            };

            await roomFirestoreService.updateRoomDoc(roomId, {
                [`players.${playerId}`]: newPlayer,
                lastActivity: Date.now()
            }, true); // use timeout

            roomSessionService.saveSession(roomId, playerId);
            return playerId;
        } catch (error) {
            errorHandlerService.handle(error, { context: 'RoomService:JoinRoom' });
            throw error;
        }
    }

    async getRoom(roomId: string): Promise<Room | null> {
        try {
            return await roomFirestoreService.getRoomDocSimple(roomId);
        } catch (error) {
            errorHandlerService.handle(error, { context: 'RoomService:GetRoom', showToast: false });
            return null;
        }
    }

    subscribeToRoom(roomId: string, callback: (room: Room | null) => void): Unsubscribe {
        return roomFirestoreService.subscribeToRoom(
            roomId,
            (room) => {
                if (!room) {
                    logService.init(`[RoomService] Room ${roomId} deleted or not found`);
                }
                callback(room);
            },
            (error) => {
                errorHandlerService.handle(error, { context: 'RoomService:SubscribeRoom', showToast: false });
            }
        );
    }

    // --- Game Flow ---

    async startGame(roomId: string): Promise<void> {
        const roomData = await roomFirestoreService.getRoomDocSimple(roomId);
        if (!roomData) return;

        const players = { ...roomData.players };

        Object.keys(players).forEach(id => {
            players[id].isReady = false;
            players[id].isWatchingReplay = false;
        });

        await roomFirestoreService.updateRoomDoc(roomId, {
            status: 'playing',
            gameState: null,
            players: players,
            lastActivity: Date.now()
        });
    }

    async returnToLobby(roomId: string, playerId: string): Promise<void> {
        const roomData = await roomFirestoreService.getRoomDocSimple(roomId);
        if (!roomData) return;

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

        await roomFirestoreService.updateRoomDoc(roomId, updates);
    }

    async updateRoomSettings(roomId: string, settings: Partial<GameSettingsState> & { allowGuestSettings?: boolean }): Promise<void> {
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

        await roomFirestoreService.updateRoomDoc(roomId, updates);
    }

    async renameRoom(roomId: string, newName: string): Promise<void> {
        await roomFirestoreService.updateRoomDoc(roomId, {
            name: newName,
            lastActivity: Date.now()
        });
    }

    // --- Delegations ---

    getSession(): { roomId: string | null, playerId: string | null } {
        return roomSessionService.getSession();
    }

    clearSession(): void {
        roomSessionService.clearSession();
    }

    async updatePlayer(roomId: string, playerId: string, data: Partial<OnlinePlayer>): Promise<void> {
        return roomPlayerService.updatePlayer(roomId, playerId, data);
    }

    async toggleReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
        return roomPlayerService.toggleReady(roomId, playerId, isReady);
    }

    async setWatchingReplay(roomId: string, playerId: string, isWatching: boolean): Promise<void> {
        return roomPlayerService.setWatchingReplay(roomId, playerId, isWatching);
    }

    async leaveRoom(roomId: string, playerId: string): Promise<void> {
        return roomPlayerService.leaveRoom(roomId, playerId);
    }

    async sendMessage(roomId: string, senderId: string, senderName: string, text: string): Promise<void> {
        return chatService.sendMessage(roomId, senderId, senderName, text);
    }

    subscribeToChat(roomId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
        return chatService.subscribeToChat(roomId, callback);
    }
}

export const roomService = new RoomService();