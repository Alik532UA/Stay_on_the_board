// src/lib/stores/uiStore.ts
/**
 * @file Store для загального UI стану.
 */

import { writable } from 'svelte/store';

export interface UiStoreState {
    shouldShowGameModeModalOnLoad: boolean;
}

export const uiState = writable<UiStoreState>({
    shouldShowGameModeModalOnLoad: false,
});

export function requestGameModeModal(): void {
    uiState.update(state => ({ ...state, shouldShowGameModeModalOnLoad: true }));
}
