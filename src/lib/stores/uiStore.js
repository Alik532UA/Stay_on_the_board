// src/stores/uiStore.js
import { writable } from 'svelte/store';

export const uiState = writable({
  isVoiceSettingsModalOpen: false,
  shouldShowGameModeModalOnLoad: false,
});

export function openVoiceSettingsModal() {
  uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: true }));
}

export function closeVoiceSettingsModal() {
  uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: false }));
}

export function requestGameModeModal() {
  uiState.update(state => ({ ...state, shouldShowGameModeModalOnLoad: true }));
}

export function clearGameModeModalRequest() {
  uiState.update(state => ({ ...state, shouldShowGameModeModalOnLoad: false }));
} 