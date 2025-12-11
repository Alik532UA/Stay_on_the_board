// src/lib/stores/uiStore.ts
/**
 * @file Store для загального UI стану.
 */

import { writable } from 'svelte/store';

export interface UiStoreState {
    isVoiceSettingsModalOpen: boolean;
    shouldShowGameModeModalOnLoad: boolean;
}

export const uiState = writable<UiStoreState>({
    isVoiceSettingsModalOpen: false,
    shouldShowGameModeModalOnLoad: false,
});

export function openVoiceSettingsModal(): void {
    uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: true }));
}

export function closeVoiceSettingsModal(): void {
    uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: false }));
}

export function requestGameModeModal(): void {
    uiState.update(state => ({ ...state, shouldShowGameModeModalOnLoad: true }));
}
