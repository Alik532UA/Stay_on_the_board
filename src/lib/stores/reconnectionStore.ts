// src/lib/stores/reconnectionStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — reconnectionState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { reconnectionState } from './reconnectionState.svelte';

export interface DisconnectedPlayer {
    id: string;
    name: string;
    disconnectStart: number;
    deadline: number;
}

function createReconnectionStore() {
    const { subscribe, set: svelteSet } = writable(reconnectionState.state);

    const syncStore = () => { svelteSet(reconnectionState.state); };

    return {
        subscribe,
        init: (roomId: string, myPlayerId: string) => {
            reconnectionState.init(roomId, myPlayerId);
            syncStore();
        },
        addPlayer: (player: { id: string; name: string }, timeoutSeconds: number = 15) => {
            reconnectionState.addPlayer(player, timeoutSeconds);
            syncStore();
        },
        removePlayer: (playerId: string) => {
            reconnectionState.removePlayer(playerId);
            syncStore();
        },
        extendDeadline: (playerId: string, seconds: number) => {
            reconnectionState.extendDeadline(playerId, seconds);
            syncStore();
        },
        reset: () => {
            reconnectionState.reset();
            syncStore();
        }
    };
}

export const reconnectionStore = createReconnectionStore();
