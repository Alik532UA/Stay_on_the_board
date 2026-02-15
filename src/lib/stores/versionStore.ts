// src/lib/stores/versionStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — versionState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { versionState } from './versionState.svelte';

const { subscribe, set: svelteSet } = writable<string | null>(versionState.state);

const syncStore = () => { svelteSet(versionState.state); };

export const appVersion = {
    subscribe,
    set: (value: string | null) => {
        versionState.state = value;
        syncStore();
    }
};
