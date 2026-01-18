import { writable, derived } from 'svelte/store';

export interface DisconnectedPlayer {
    id: string;
    name: string;
    disconnectStart: number;
    deadline: number; // Timestamp when they can be kicked
}

interface ReconnectionState {
    roomId: string;
    myPlayerId: string;
    players: DisconnectedPlayer[];
}

const initialState: ReconnectionState = {
    roomId: '',
    myPlayerId: '',
    players: []
};

function createReconnectionStore() {
    const { subscribe, set, update } = writable<ReconnectionState>(initialState);

    return {
        subscribe,
        init: (roomId: string, myPlayerId: string) => {
            set({ roomId, myPlayerId, players: [] });
        },
        addPlayer: (player: { id: string; name: string }, timeoutSeconds: number = 15) => {
            update(state => {
                const exists = state.players.find(p => p.id === player.id);
                if (exists) return state;

                const now = Date.now();
                return {
                    ...state,
                    players: [...state.players, {
                        id: player.id,
                        name: player.name,
                        disconnectStart: now,
                        deadline: now + (timeoutSeconds * 1000)
                    }]
                };
            });
        },
        removePlayer: (playerId: string) => {
            update(state => ({
                ...state,
                players: state.players.filter(p => p.id !== playerId)
            }));
        },
        extendDeadline: (playerId: string, seconds: number) => {
            update(state => ({
                ...state,
                players: state.players.map(p => 
                    p.id === playerId 
                        ? { ...p, deadline: p.deadline + (seconds * 1000) }
                        : p
                )
            }));
        },
        reset: () => set(initialState)
    };
}

export const reconnectionStore = createReconnectionStore();
