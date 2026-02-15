import { writable } from 'svelte/store';
import type { MoveDirectionType } from '$lib/models/Piece';
import { dev } from '$app/environment';
import { gameEventBus } from '$lib/services/gameEventBus';

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
  intendedGameType: 'training' | 'local' | 'timed' | 'virtual-player' | 'online' | null;
  settingsMode: 'default' | 'competitive';
  isSettingsExpanderOpen: boolean;
  testModeOverrides?: {
    nextComputerMove?: { direction: MoveDirectionType; distance: number };
  };
  lastMove: { direction: MoveDirectionType; distance: number; player: number } | null;
  // Нові поля для онлайн режиму
  onlinePlayerIndex: number | null; // 0 (Host) або 1 (Guest)
  amIHost: boolean;
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
  intendedGameType: null,
  settingsMode: 'default',
  isSettingsExpanderOpen: dev,
  lastMove: null,
  onlinePlayerIndex: null,
  amIHost: false
};

function createUiStateStore() {
  const { subscribe, set, update } = writable<UiState>(initialUIState);
  let unsubscribers: (() => void)[] = [];

  return {
    subscribe,
    set,
    update,
    reset: () => set(initialUIState),
    setGameOver: (reasonKey: string, reasonValues: Record<string, any> | null = null) => {
      update(state => {
        if (!state) return null;
        return { ...state, isGameOver: true, gameOverReasonKey: reasonKey, gameOverReasonValues: reasonValues };
      });
    },
    /**
     * Ініціалізує слухачів подій для автоматичного оновлення стану.
     */
    initEventListeners: () => {
      // Очищаємо старі підписки, якщо вони були
      unsubscribers.forEach(u => u());
      unsubscribers = [];

      // 1. Слухаємо успішний хід
      unsubscribers.push(
        gameEventBus.subscribe('GAME_MOVE_SUCCESS', (payload) => {
          update(s => s ? ({
            ...s,
            selectedDirection: null,
            selectedDistance: null,
            isFirstMove: false,
            lastMove: {
              direction: payload.direction,
              distance: payload.distance,
              player: payload.playerIndex
            }
          }) : null);
        })
      );

      // 2. Слухаємо помилку ходу
      unsubscribers.push(
        gameEventBus.subscribe('GAME_MOVE_FAILURE', () => {
          update(s => s ? ({
            ...s,
            selectedDirection: null,
            selectedDistance: null,
            lastMove: null
          }) : null);
        })
      );

      // 3. Слухаємо завершення гри (скидання вибору)
      unsubscribers.push(
        gameEventBus.subscribe('GameOver', () => {
          update(s => s ? ({ ...s, selectedDirection: null, selectedDistance: null }) : null);
        })
      );
    },
    destroy: () => {
      unsubscribers.forEach(u => u());
      unsubscribers = [];
    }
  };
}

export const uiStateStore = createUiStateStore();