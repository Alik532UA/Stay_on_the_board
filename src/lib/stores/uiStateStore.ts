/**
 * @file Manages the general UI state of the application.
 * @description This store tracks transient UI states that are not specific to a single component,
 * such as whether a computer move is in progress, game over status, and player input selections.
 * It helps coordinate UI behavior across different parts of the application.
 */
// src/lib/stores/uiStateStore.ts
import { writable } from 'svelte/store';
import type { MoveDirectionType } from '$lib/models/Piece';
import { dev } from '$app/environment';

export interface UiState {
  showBoardHiddenInfo: boolean;
  isComputerMoveInProgress: boolean;
  isGameOver: boolean;
  gameOverReasonKey: string | null;
  gameOverReasonValues: Record<string, any> | null;
  selectedDirection: MoveDirectionType | null;
  selectedDistance: number | null;
  isFirstMove: boolean;
  isListening: boolean;
  voiceMoveRequested: boolean;
  intendedGameType: 'training' | 'local' | 'timed' | 'virtual-player' | null; // НАВІЩО: Зберігаємо тип гри, який користувач мав намір розпочати.
  settingsMode: 'default' | 'competitive';
  isSettingsExpanderOpen: boolean;
  // НАВІЩО: Додаємо поле для перевизначень з тестового режиму.
  // Це дозволяє передавати тестові дані через стан, дотримуючись UDF.
  testModeOverrides?: {
    nextComputerMove?: { direction: MoveDirectionType; distance: number };
  };
}

export const initialUIState: UiState = {
  showBoardHiddenInfo: false,
  isComputerMoveInProgress: false,
  isGameOver: false,
  gameOverReasonKey: null,
  gameOverReasonValues: null,
  selectedDirection: null,
  selectedDistance: null,
  isFirstMove: true,
  isListening: false,
  voiceMoveRequested: false,
  intendedGameType: null, // За замовчуванням немає наміру
  settingsMode: 'default',
  isSettingsExpanderOpen: dev,
};

function createUiStateStore() {
  const { subscribe, set, update } = writable<UiState>(initialUIState);

  return {
    subscribe,
    set,
    update,
    setGameOver: (reasonKey: string, reasonValues: Record<string, any> | null = null) => {
      update(state => {
        if (!state) return null;
        return { ...state, isGameOver: true, gameOverReasonKey: reasonKey, gameOverReasonValues: reasonValues };
      });
    },
    // Інші мутатори для UI...
  };
}

export const uiStateStore = createUiStateStore();