// src/stores/uiStore.js
import { writable } from 'svelte/store';

export const uiState = writable({
  isVoiceSettingsModalOpen: false,
});

export function openVoiceSettingsModal() {
  uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: true }));
}

export function closeVoiceSettingsModal() {
  uiState.update(state => ({ ...state, isVoiceSettingsModalOpen: false }));
} 