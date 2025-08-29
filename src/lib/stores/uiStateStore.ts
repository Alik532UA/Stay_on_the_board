// src/lib/stores/uiStateStore.ts
import { writable } from 'svelte/store';
import type { MoveDirectionType } from '$lib/models/Figure';

export interface UiState {
  isComputerMoveInProgress: boolean;
  isGameOver: boolean;
  gameOverReasonKey: string | null;
  gameOverReasonValues: Record<string, any> | null;
  selectedDirection: MoveDirectionType | null;
  selectedDistance: number | null;
  isFirstMove: boolean;
  intendedGameType: 'training' | 'local' | 'timed' | null; // НАВІЩО: Зберігаємо тип гри, який користувач мав намір розпочати.
  // НАВІЩО: Додаємо поле для перевизначень з тестового режиму.
  // Це дозволяє передавати тестові дані через стан, дотримуючись UDF.
  testModeOverrides?: {
    nextComputerMove?: { direction: MoveDirectionType; distance: number };
  };
}

export const initialUIState: UiState = {
  isComputerMoveInProgress: false,
  isGameOver: false,
  gameOverReasonKey: null,
  gameOverReasonValues: null,
  selectedDirection: null,
  selectedDistance: null,
  isFirstMove: true,
  intendedGameType: null, // За замовчуванням немає наміру
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