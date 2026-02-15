// src/lib/stores/replayStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — replayStoreState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import type { MoveHistoryEntry } from '$lib/models/moveHistory';
import { replayStateRune } from './replayStoreState.svelte';

export type { AutoPlayDirection, ReplayState } from './replayStoreState.svelte';

const { subscribe, set: svelteSet } = writable(replayStateRune.state);

const syncStore = () => { svelteSet(replayStateRune.state); };

export const replayStore = {
    subscribe,
    startReplay: (moveHistory: MoveHistoryEntry[], boardSize: number): void => {
        replayStateRune.startReplay(moveHistory, boardSize);
        syncStore();
    },
    stopReplay: (): void => {
        replayStateRune.stopReplay();
        syncStore();
    }
};
