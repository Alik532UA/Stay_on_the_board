/**
 * @file Manages settings related to a specific game session.
 * @description This store is the SSoT for all game-related settings.
 * It is initialized with default values and can be updated by other services,
 * like the SettingsPersistenceService which handles loading settings from localStorage.
 */
// src/lib/stores/gameSettingsStore.ts
import { writable, get } from 'svelte/store';
import { logService } from '../services/logService';
import { uiStateStore } from './uiStateStore.js';
import { boardStore } from './boardStore.ts';
import { availableMovesService } from '../services/availableMovesService.ts';

// Re-export types for backward compatibility
export type {
  KeybindingAction,
  VirtualPlayerPreset,
  LocalPreset,
  OnlinePreset,
  LegacyPreset,
  GameModePreset,
  GameSettingsState
} from './gameSettingsTypes';

// Import types and defaults from extracted files
import type { GameModePreset, GameSettingsState } from './gameSettingsTypes';
import { defaultGameSettings, defaultKeybindings } from './gameSettingsDefaults';
import { presetConfigurations } from './gameSettingsPresets';

// Re-export defaults for backward compatibility
export { defaultGameSettings } from './gameSettingsDefaults';

function createGameSettingsStore() {
  // The store is now initialized with the default settings.
  // The SettingsPersistenceService is responsible for loading persisted data
  // and updating the store via the `set` method.
  const { subscribe, set, update } = writable<GameSettingsState>(defaultGameSettings);

  const syncGameMode = (state: GameSettingsState): GameSettingsState => {
    // Блокуємо синхронізацію для: lockSettings, timed преsets, або базового local пресету
    if (state.lockSettings || state.gameMode === 'timed' || state.gameMode === 'local' || state.gameMode?.includes('timed')) {
      return state;
    }

    // Визначаємо контекст гри (local або virtual-player)
    const intendedGameType = get(uiStateStore).intendedGameType;
    const isLocalGameContext = intendedGameType === 'local';
    const isVirtualPlayerContext = intendedGameType === 'virtual-player';
    const isOnlineContext = intendedGameType === 'online';

    // Блокуємо синхронізацію, якщо пресет не відповідає контексту
    // (наприклад, local-observer в virtual-player контексті)
    if (state.gameMode) {
      const currentPrefix = state.gameMode.split('-')[0];
      const expectedPrefix = intendedGameType;
      if (currentPrefix !== expectedPrefix && ['local', 'virtual', 'online'].includes(currentPrefix)) {
        // Пресет не відповідає контексту - не змінюємо
        return state;
      }
    }

    let newMode: GameModePreset | null = null;

    if (isLocalGameContext) {
      // Local game presets
      if (!state.autoHideBoard) {
        newMode = 'local-observer';
      } else {
        newMode = state.blockModeEnabled ? 'local-pro' : 'local-experienced';
      }
    } else if (isVirtualPlayerContext) {
      // Virtual-player presets
      if (!state.autoHideBoard) {
        newMode = 'virtual-player-beginner';
      } else {
        newMode = state.blockModeEnabled ? 'virtual-player-pro' : 'virtual-player-experienced';
      }
    } else if (isOnlineContext) {
      // Online presets (майбутнє)
      if (!state.autoHideBoard) {
        newMode = 'online-beginner';
      } else {
        newMode = state.blockModeEnabled ? 'online-pro' : 'online-experienced';
      }
    }

    if (newMode && state.gameMode !== newMode) {
      logService.GAME_MODE(`[syncGameMode] Context: ${intendedGameType}, Current: ${state.gameMode}, New: ${newMode}`);
      state.gameMode = newMode;
    }

    return state;
  };

  const methods = {
    set, // Expose the set method to allow the persistence service to overwrite the state.
    updateSettings: (newSettings: Partial<GameSettingsState>) => {
      logService.state('[GameSettingsStore] updateSettings called with:', newSettings);
      update(state => {
        let updatedState = { ...state, ...newSettings };
        updatedState = syncGameMode(updatedState);
        return updatedState;
      });
    },
    resetSettings: () => {
      // Now reset just sets the defaults, persistence is handled elsewhere.
      logService.action('[GameSettingsStore] Resetting settings to default.');
      set(defaultGameSettings);
    },
    resetKeybindings: () => {
      update(state => ({ ...state, keybindings: defaultGameSettings.keybindings }));
    },
    toggleShowBoard: (forceState?: boolean) => {
      logService.state('[GameSettingsStore] toggleShowBoard called', { forceState });
      update(state => {
        if (typeof forceState === 'boolean') {
          const newSettings: Partial<GameSettingsState> = { ...state, showBoard: forceState };
          if (!forceState) {
            newSettings.showPiece = false;
            newSettings.showMoves = false;
          } else {
            newSettings.showPiece = true;
            newSettings.showMoves = true;
          }
          return newSettings as GameSettingsState;
        }

        const { showBoard } = state;
        const newShowBoard = !showBoard;

        return {
          ...state,
          showBoard: newShowBoard,
          showPiece: newShowBoard,
          showMoves: newShowBoard
        };
      });
    },
    toggleShowMoves: () => {
      logService.state('[GameSettingsStore] toggleShowMoves called');
      update(state => ({ ...state, showMoves: !state.showMoves }))
    },
    toggleShowPiece: () => {
      logService.state('[GameSettingsStore] toggleShowPiece called');
      update(state => {
        const newShowPieceState = !state.showPiece;
        const newSettings: Partial<GameSettingsState> = { ...state, showPiece: newShowPieceState };
        if (!newShowPieceState) {
          newSettings.showMoves = false;
        }
        return newSettings as GameSettingsState;
      });
    },
    toggleAutoHideBoard: () => {
      update(state => {
        let updatedState = { ...state, autoHideBoard: !state.autoHideBoard };
        updatedState = syncGameMode(updatedState);
        return updatedState;
      });
    },
    setGameInfoWidgetState: (newState: 'hidden' | 'shown' | 'compact') => update(state => ({ ...state, showGameInfoWidget: newState })),
    toggleBlockMode: () => {
      update(state => {
        let updatedState = { ...state, blockModeEnabled: !state.blockModeEnabled };
        updatedState = syncGameMode(updatedState);
        return updatedState;
      });
      boardStore.resetCellVisitCounts();
      availableMovesService.updateAvailableMoves();
    },
    toggleSpeech: () => update(state => ({ ...state, speechEnabled: !state.speechEnabled })),

    applyPreset: (preset: GameModePreset) => {
      logService.GAME_MODE(`[GameSettingsStore] Applying preset: "${preset}"`);

      const presetSettings = presetConfigurations[preset];

      if (!presetSettings) {
        logService.error(`[GameSettingsStore] Unknown preset: "${preset}"`);
        return;
      }

      const currentState = get(gameSettingsStore);

      if (presetSettings.blockModeEnabled !== undefined && presetSettings.blockModeEnabled !== currentState.blockModeEnabled) {
        boardStore.resetCellVisitCounts();
        availableMovesService.updateAvailableMoves();
      }

      methods.updateSettings(presetSettings);
    },
  };

  return {
    subscribe,
    ...methods
  };
}

export const gameSettingsStore = createGameSettingsStore();