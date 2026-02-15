// src/lib/stores/debugLogStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — debugLogState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { debugLogState } from './debugLogState.svelte';

const { subscribe, set: svelteSet } = writable<string[]>(debugLogState.state);

const syncStore = () => { svelteSet(debugLogState.state); };

export const debugLogStore = {
    subscribe,
    add: (message: string) => {
        debugLogState.add(message);
        syncStore();
    },
    clear: () => {
        debugLogState.clear();
        syncStore();
    }
};
