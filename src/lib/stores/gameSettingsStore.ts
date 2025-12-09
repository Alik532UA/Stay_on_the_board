/**
 * @file Manages settings related to a specific game session.
 * @description This store is the SSoT for all game-related settings.
 * It is initialized with default values and can be updated by other services,
 * like the SettingsPersistenceService which handles loading settings from localStorage.
 */
// src/lib/stores/gameSettingsStore.ts
import { writable, get } from 'svelte/store';
import { logService } from '../services/logService.js';
import { uiStateStore } from './uiStateStore.js';
import { boardStore } from './boardStore.ts';
import { availableMovesService } from '../services/availableMovesService.ts';

export type KeybindingAction = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' | 'confirm' | 'no-moves' | 'toggle-block-mode' | 'toggle-board' | 'increase-board' | 'decrease-board' | 'toggle-speech' | 'distance-1' | 'distance-2' | 'distance-3' | 'distance-4' | 'distance-5' | 'distance-6' | 'distance-7' | 'distance-8' | 'auto-hide-board' | 'show-help' | 'main-menu';
export type GameModePreset = 'beginner' | 'experienced' | 'pro' | 'timed' | 'local' | 'online' | 'observer';

export type GameSettingsState = {
  showMoves: boolean;
  showBoard: boolean;
  speechEnabled: boolean;
  selectedVoiceURI: string | null;
  blockModeEnabled: boolean;
  showPiece: boolean;
  blockOnVisitCount: number;
  autoHideBoard: boolean;
  boardSize: number;
  keybindings: Record<KeybindingAction, string[]>;
  keyConflictResolution: Record<string, KeybindingAction>;
  gameMode: GameModePreset | null;
  rememberGameMode: boolean;
  showGameModeModal: boolean;
  showDifficultyWarningModal: boolean;
  showGameInfoWidget: 'hidden' | 'shown' | 'compact';
  lockSettings: boolean;
  speechRate: number;
  speechOrder: 'dir_dist' | 'dist_dir';
  shortSpeech: boolean;
  speechFor: { player: boolean; computer: boolean };
  speakModalTitles: boolean;
};

const isBrowser = typeof window !== 'undefined';

export const defaultGameSettings: GameSettingsState = {
  showMoves: true,
  showBoard: true,
  speechEnabled: true,
  selectedVoiceURI: null,
  blockModeEnabled: false,
  showPiece: true,
  blockOnVisitCount: 0,
  autoHideBoard: true,
  boardSize: 4,
  keybindings: {
    'up-left': ['Numpad7', 'KeyQ'], 'up': ['Numpad8', 'KeyW'], 'up-right': ['Numpad9', 'KeyE'],
    'left': ['Numpad4', 'KeyA'], 'right': ['Numpad6', 'KeyD'],
    'down-left': ['Numpad1', 'KeyZ'], 'down': ['Numpad2', 'KeyX', 'KeyS'], 'down-right': ['Numpad3', 'KeyC'],
    'confirm': ['Numpad5', 'Enter', 'Space', 'NumpadEnter', 'KeyS'], 'no-moves': ['NumpadDecimal', 'Backspace'],
    'distance-1': ['Digit1'], 'distance-2': ['Digit2'], 'distance-3': ['Digit3'],
    'distance-4': ['Digit4'], 'distance-5': ['Digit5'], 'distance-6': ['Digit6'],
    'distance-7': ['Digit7'], 'distance-8': ['Digit8'],
    'toggle-block-mode': ['NumpadMultiply', 'KeyB'], 'toggle-board': ['NumpadDivide', 'KeyH'],
    'increase-board': ['NumpadAdd', 'Equal'], 'decrease-board': ['NumpadSubtract', 'Minus'],
    'toggle-speech': ['KeyV'],
    'auto-hide-board': ['Numpad0'],
    'show-help': ['KeyI'],
    'main-menu': ['Escape'],
  },
  keyConflictResolution: {},
  gameMode: 'experienced',
  rememberGameMode: true,
  showGameModeModal: true,
  showDifficultyWarningModal: true,
  showGameInfoWidget: 'compact',
  lockSettings: false,
  speechRate: 1.4,
  speechOrder: 'dist_dir',
  shortSpeech: true,
  speechFor: { player: false, computer: true },
  speakModalTitles: true,
};

function createGameSettingsStore() {
  // The store is now initialized with the default settings.
  // The SettingsPersistenceService is responsible for loading persisted data
  // and updating the store via the `set` method.
  const { subscribe, set, update } = writable<GameSettingsState>(defaultGameSettings);

  const syncGameMode = (state: GameSettingsState): GameSettingsState => {
    // Блокуємо синхронізацію для: lockSettings, timed, або базового local пресету
    if (state.lockSettings || state.gameMode === 'timed' || state.gameMode === 'local') {
      return state;
    }

    // Визначаємо контекст гри (local або virtual-player)
    const intendedGameType = get(uiStateStore).intendedGameType;
    const isLocalGameContext = intendedGameType === 'local';

    // Блокуємо синхронізацію для 'observer' в virtual-player контексті
    // (observer - це пресет тільки для локальної гри)
    if (state.gameMode === 'observer' && !isLocalGameContext) {
      return state;
    }

    let newMode: GameModePreset | null = null;

    if (!state.autoHideBoard) {
      // Автоприховування ВИМКНЕНО
      // Local: observer (Наглядач), Virtual-player: beginner (Новачок)
      newMode = isLocalGameContext ? 'observer' : 'beginner';
    } else {
      // Автоприховування УВІМКНЕНО
      if (state.blockModeEnabled) {
        // Автоприховування + Блокування → "Потужний" (pro)
        newMode = 'pro';
      } else {
        // Автоприховування БЕЗ блокування → "Розбійник" (experienced)
        newMode = 'experienced';
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
      const presets: Record<GameModePreset, Partial<GameSettingsState>> = {
        beginner: {
          gameMode: 'beginner',
          blockModeEnabled: false,
          autoHideBoard: false,
          speechEnabled: false,
          rememberGameMode: true,
          speechRate: 1,
          shortSpeech: false,
          speechFor: { player: true, computer: true },
          showGameInfoWidget: 'shown',
          showBoard: true,
          showPiece: true,
          showMoves: true,
        },
        experienced: {
          gameMode: 'experienced',
          blockModeEnabled: false,
          autoHideBoard: true,
          speechEnabled: true,
          rememberGameMode: true,
          speechRate: 1.4,
          shortSpeech: true,
          speechFor: { player: false, computer: true },
          showGameInfoWidget: 'compact',
        },
        pro: {
          gameMode: 'pro',
          blockModeEnabled: true,
          autoHideBoard: true,
          speechEnabled: true,
          rememberGameMode: true,
          speechRate: 1.6,
          shortSpeech: true,
          speechFor: { player: false, computer: true },
          showGameInfoWidget: 'compact',
        },
        timed: {
          gameMode: 'timed',
          autoHideBoard: true,
          blockModeEnabled: true,
          speechEnabled: false,
          showGameInfoWidget: 'compact',
          speechRate: 1.6,
          shortSpeech: true,
          speechFor: { player: false, computer: true },
        },
        local: {
          autoHideBoard: true,
          blockModeEnabled: true,
          speechEnabled: false,
          showGameInfoWidget: 'compact',
          speechRate: 1.6,
          shortSpeech: true,
          speechFor: { player: false, computer: true },
        },
        online: {
          autoHideBoard: true,
          blockModeEnabled: true,
          speechEnabled: false,
          showGameInfoWidget: 'compact',
          speechRate: 1.6,
          shortSpeech: true,
          speechFor: { player: false, computer: true },
        },
        observer: {
          gameMode: 'observer',
          autoHideBoard: false,
          blockModeEnabled: false,
          speechEnabled: false,
          showGameInfoWidget: 'compact',
          speechRate: 1.6,
          shortSpeech: true,
          speechFor: { player: false, computer: true },
        }
      };

      const presetSettings = presets[preset];
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