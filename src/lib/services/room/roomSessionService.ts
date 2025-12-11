const STORAGE_KEYS = {
    ROOM_ID: 'online_roomId',
    PLAYER_ID: 'online_playerId'
};

export class RoomSessionService {
    saveSession(roomId: string, playerId: string) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
            localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
        }
    }

    getSession(): { roomId: string | null, playerId: string | null } {
        if (typeof localStorage !== 'undefined') {
            return {
                roomId: localStorage.getItem(STORAGE_KEYS.ROOM_ID),
                playerId: localStorage.getItem(STORAGE_KEYS.PLAYER_ID)
            };
        }
        return { roomId: null, playerId: null };
    }

    clearSession() {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.ROOM_ID);
            localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
        }
    }
}

export const roomSessionService = new RoomSessionService();