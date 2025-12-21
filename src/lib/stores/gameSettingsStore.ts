/**
 * @file Manages settings related to a specific game session.
 * @description This store is the SSoT for all game-related settings.
 */
import { writable, get } from 'svelte/store';
import { logService } from '../services/logService';
import { uiStateStore } from './uiStateStore';
import { boardStore } from './boardStore';
import { availableMovesService } from '../services/availableMovesService';
import { syncGameModeLogic } from '$lib/logic/settingsLogic';

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

import type { GameModePreset, GameSettingsState } from './gameSettingsTypes';
import { defaultGameSettings } from './gameSettingsDefaults';
import { presetConfigurations } from './gameSettingsPresets';

export { defaultGameSettings } from './gameSettingsDefaults';

function createGameSettingsStore() {
  const { subscribe, set, update } = writable<GameSettingsState>(defaultGameSettings);

  // Helper wrapper to apply sync logic using current UI state
  const applySync = (state: GameSettingsState): GameSettingsState => {
    const uiState = get(uiStateStore);
    return syncGameModeLogic(state, uiState);
  };

  const methods = {
    set,
    updateSettings: (newSettings: Partial<GameSettingsState>) => {
      logService.state('[GameSettingsStore] updateSettings called with:', newSettings);
      update(state => {
        let updatedState = { ...state, ...newSettings };
        updatedState = applySync(updatedState);
        return updatedState;
      });
    },
    resetSettings: () => {
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
        updatedState = applySync(updatedState);
        return updatedState;
      });
    },
    setGameInfoWidgetState: (newState: 'hidden' | 'shown' | 'compact') => update(state => ({ ...state, showGameInfoWidget: newState })),
    toggleBlockMode: () => {
      update(state => {
        let updatedState = { ...state, blockModeEnabled: !state.blockModeEnabled };
        updatedState = applySync(updatedState);
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