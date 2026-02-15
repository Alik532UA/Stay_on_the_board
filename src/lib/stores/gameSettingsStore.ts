/**
 * @file Manages settings related to a specific game session.
 * @description Bridge pattern: writable-обгортка для Svelte 4.
 * SSoT — gameSettingsState.svelte.ts (Runes).
 */
import { writable, get } from 'svelte/store';
import { logService } from '../services/logService';
import { uiStateStore } from './uiStateStore';
import { boardStore } from './boardStore';
import { availableMovesService } from '../services/availableMovesService';
import { syncGameModeLogic } from '$lib/logic/settingsLogic';
import { gameSettingsState } from './gameSettingsState.svelte';

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
  const { subscribe, set: svelteSet } = writable<GameSettingsState>(gameSettingsState.state);

  const syncStore = () => { svelteSet(gameSettingsState.state); };

  // Helper wrapper to apply sync logic using current UI state
  const applySync = (state: GameSettingsState): GameSettingsState => {
    const uiState = get(uiStateStore);
    return syncGameModeLogic(state, uiState);
  };

  const methods = {
    set: (value: GameSettingsState) => {
      gameSettingsState.state = value;
      syncStore();
    },
    updateSettings: (newSettings: Partial<GameSettingsState>) => {
      logService.state('[GameSettingsStore] updateSettings called with:', newSettings);
      gameSettingsState.update(state => {
        let updatedState = { ...state, ...newSettings };
        updatedState = applySync(updatedState);
        return updatedState;
      });
      syncStore();
    },
    resetSettings: () => {
      logService.action('[GameSettingsStore] Resetting settings to default.');
      gameSettingsState.state = defaultGameSettings;
      syncStore();
    },
    resetKeybindings: () => {
      gameSettingsState.update(state => ({ ...state, keybindings: defaultGameSettings.keybindings }));
      syncStore();
    },
    toggleShowBoard: (forceState?: boolean) => {
      logService.state('[GameSettingsStore] toggleShowBoard called', { forceState });
      gameSettingsState.update(state => {
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
      syncStore();
    },
    toggleShowMoves: () => {
      logService.state('[GameSettingsStore] toggleShowMoves called');
      gameSettingsState.update(state => ({ ...state, showMoves: !state.showMoves }));
      syncStore();
    },
    toggleShowPiece: () => {
      logService.state('[GameSettingsStore] toggleShowPiece called');
      gameSettingsState.update(state => {
        const newShowPieceState = !state.showPiece;
        const newSettings: Partial<GameSettingsState> = { ...state, showPiece: newShowPieceState };
        if (!newShowPieceState) {
          newSettings.showMoves = false;
        }
        return newSettings as GameSettingsState;
      });
      syncStore();
    },
    toggleAutoHideBoard: () => {
      gameSettingsState.update(state => {
        let updatedState = { ...state, autoHideBoard: !state.autoHideBoard };
        updatedState = applySync(updatedState);
        return updatedState;
      });
      syncStore();
    },
    setGameInfoWidgetState: (newState: 'hidden' | 'shown' | 'compact') => {
      gameSettingsState.update(state => ({ ...state, showGameInfoWidget: newState }));
      syncStore();
    },
    toggleBlockMode: () => {
      gameSettingsState.update(state => {
        let updatedState = { ...state, blockModeEnabled: !state.blockModeEnabled };
        updatedState = applySync(updatedState);
        return updatedState;
      });
      syncStore();
      boardStore.resetCellVisitCounts();
      availableMovesService.updateAvailableMoves();
    },
    toggleSpeech: () => {
      gameSettingsState.update(state => ({ ...state, speechEnabled: !state.speechEnabled }));
      syncStore();
    },

    applyPreset: (preset: GameModePreset) => {
      logService.GAME_MODE(`[GameSettingsStore] Applying preset: "${preset}"`);

      const presetSettings = presetConfigurations[preset];

      if (!presetSettings) {
        logService.error(`[GameSettingsStore] Unknown preset: "${preset}"`);
        return;
      }

      const currentState = gameSettingsState.state;

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