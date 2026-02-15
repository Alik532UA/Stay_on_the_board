// src/lib/stores/layoutUpdateStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — layoutUpdateState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { layoutUpdateState } from './layoutUpdateState.svelte';

const { subscribe, set: svelteSet } = writable<number>(layoutUpdateState.state);

const syncStore = () => { svelteSet(layoutUpdateState.state); };

export const layoutUpdateStore = {
    subscribe,
    set: (value: number) => {
        layoutUpdateState.state = value;
        syncStore();
    },
    update: (fn: (s: number) => number) => {
        layoutUpdateState.state = fn(layoutUpdateState.state);
        syncStore();
    }
};
