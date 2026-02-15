// src/lib/stores/columnStyleStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — columnStyleState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { columnStyleState } from './columnStyleState.svelte';

export type { ColumnStyleMode } from './columnStyleState.svelte';

const { subscribe, set: svelteSet } = writable(columnStyleState.state);

const syncStore = () => { svelteSet(columnStyleState.state); };

export const columnStyleMode = {
    subscribe,
    set: (value: 'fixed' | 'flexible') => {
        columnStyleState.state = value;
        syncStore();
    },
    update: (fn: (s: 'fixed' | 'flexible') => 'fixed' | 'flexible') => {
        columnStyleState.state = fn(columnStyleState.state);
        syncStore();
    }
};
