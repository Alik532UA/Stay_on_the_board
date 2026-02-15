// src/lib/stores/uiStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — uiGeneralState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { uiGeneralState } from './uiGeneralState.svelte';
import type { UiStoreState } from './uiGeneralState.svelte';

const { subscribe, set: svelteSet } = writable<UiStoreState>(uiGeneralState.state);

const syncStore = () => { svelteSet(uiGeneralState.state); };

export const uiState = {
    subscribe,
    set: (value: UiStoreState) => {
        uiGeneralState.state = value;
        syncStore();
    },
    update: (fn: (s: UiStoreState) => UiStoreState) => {
        uiGeneralState.update(fn);
        syncStore();
    }
};

export function requestGameModeModal(): void {
    uiGeneralState.requestGameModeModal();
    syncStore();
}

export type { UiStoreState };
