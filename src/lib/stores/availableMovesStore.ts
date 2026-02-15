// src/lib/stores/availableMovesStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — availableMovesState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import type { Move } from '$lib/utils/gameUtils';
import { availableMovesState } from './availableMovesState.svelte';

const { subscribe, set: svelteSet } = writable<Move[]>(availableMovesState.state);

const syncStore = () => { svelteSet(availableMovesState.state); };

export const availableMovesStore = {
    subscribe,
    set: (value: Move[]) => {
        availableMovesState.state = value;
        syncStore();
    },
    update: (fn: (s: Move[]) => Move[]) => {
        availableMovesState.state = fn(availableMovesState.state);
        syncStore();
    }
};
