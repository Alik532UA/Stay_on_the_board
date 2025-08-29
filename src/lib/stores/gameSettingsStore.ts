/**
 * @file Manages settings related to a specific game session.
 * @description This store handles configurations that affect the gameplay of a single match,
 * such as board size, difficulty presets (game mode), and control schemes (keybindings).
 * While these settings are persisted in localStorage for convenience, they are conceptually
 * tied to a game session and can be reset or changed for each new game.
 */
// src/lib/stores/gameSettingsStore.ts
import { writable, get } from 'svelte/store';
import { logService } from '../services/logService.js';
import { uiStateStore } from './uiStateStore.js';

export type KeybindingAction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'|'confirm'|'no-moves'|'toggle-block-mode'|'toggle-board'|'increase-board'|'decrease-board'|'toggle-speech'|'distance-1'|'distance-2'|'distance-3'|'distance-4'|'distance-5'|'distance-6'|'distance-7'|'distance-8';
export type GameModePreset = 'beginner' | 'experienced' | 'pro';

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
};

const isBrowser = typeof window !== 'undefined';
let isInitialized = false;

const defaultGameSettings: GameSettingsState = {
    showMoves: true,
    showBoard: true,
    speechEnabled: false,
    selectedVoiceURI: null,
    blockModeEnabled: false,
    showPiece: true,
    blockOnVisitCount: 0,
    autoHideBoard: false,
    boardSize: 4,
    keybindings: {
        'up-left': ['Numpad7', 'KeyQ'], 'up': ['Numpad8', 'KeyW'], 'up-right': ['Numpad9', 'KeyE'],
        'left': ['Numpad4', 'KeyA'], 'right': ['Numpad6', 'KeyD'],
        'down-left': ['Numpad1', 'KeyZ'], 'down': ['Numpad2', 'KeyX'], 'down-right': ['Numpad3', 'KeyC'],
        'confirm': ['Numpad5', 'Enter', 'Space'], 'no-moves': ['NumpadDecimal', 'Backspace'],
        'distance-1': ['Digit1'], 'distance-2': ['Digit2'], 'distance-3': ['Digit3'],
        'distance-4': ['Digit4'], 'distance-5': ['Digit5'], 'distance-6': ['Digit6'],
        'distance-7': ['Digit7'], 'distance-8': ['Digit8'],
        'toggle-block-mode': ['NumpadMultiply', 'KeyB'], 'toggle-board': ['NumpadDivide', 'KeyH'],
        'increase-board': ['NumpadAdd', 'Equal'], 'decrease-board': ['NumpadSubtract', 'Minus'],
        'toggle-speech': ['KeyS'],
    },
    keyConflictResolution: {},
    gameMode: null,
    rememberGameMode: false,
    showGameModeModal: true,
    showDifficultyWarningModal: true,
    showGameInfoWidget: 'shown',
    lockSettings: false,
};

function loadGameSettings(): GameSettingsState {
    if (!isBrowser) return defaultGameSettings;
    const saved = localStorage.getItem('gameSettings');
    return saved ? { ...defaultGameSettings, ...JSON.parse(saved) } : defaultGameSettings;
}

function saveGameSettings(settings: GameSettingsState) {
    if (!isBrowser) return;
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    logService.state('[GameSettingsStore] Стан збережено в localStorage:', settings);
}

function createGameSettingsStore() {
  const initialState = loadGameSettings();
  const { subscribe, set, update } = writable<GameSettingsState>(initialState);

  const methods = {
    init: () => {
      if (isInitialized || !isBrowser) return;
      isInitialized = true;
      const settings = loadGameSettings();
      set(settings);
      subscribe(saveGameSettings);

      uiStateStore.subscribe(state => {
        if (state && state.isFirstMove) {
          methods.updateSettings({ showBoard: true, showPiece: true, showMoves: true });
        }
      });
      logService.init('gameSettingsStore ініціалізовано успішно');
    },
    updateSettings: (newSettings: Partial<GameSettingsState>) => {
      update(state => ({ ...state, ...newSettings }));
    },
    resetSettings: () => {
      if (isBrowser) {
        localStorage.removeItem('gameSettings');
      }
      set(defaultGameSettings);
    },
    resetKeybindings: () => {
      update(state => ({ ...state, keybindings: defaultGameSettings.keybindings }));
    },
    toggleShowBoard: (forceState?: boolean) => {
      update((state: GameSettingsState) => {
        const newShowBoardState = typeof forceState === 'boolean' ? forceState : !state.showBoard;
        const newSettings: Partial<GameSettingsState> = { ...state, showBoard: newShowBoardState };
        if (!newShowBoardState) {
          newSettings.showPiece = false;
          newSettings.showMoves = false;
        }
        return newSettings as GameSettingsState;
      });
    },
    toggleShowMoves: () => update(state => ({ ...state, showMoves: !state.showMoves })),
    toggleShowPiece: () => {
      update(state => {
        const newShowPieceState = !state.showPiece;
        const newSettings: Partial<GameSettingsState> = { ...state, showPiece: newShowPieceState };
        if (!newShowPieceState) {
          newSettings.showMoves = false;
        }
        return newSettings as GameSettingsState;
      });
    },
    toggleAutoHideBoard: () => update(state => ({ ...state, autoHideBoard: !state.autoHideBoard })),
    setGameInfoWidgetState: (newState: 'hidden' | 'shown' | 'compact') => update(state => ({ ...state, showGameInfoWidget: newState })),
    toggleBlockMode: () => update(state => ({ ...state, blockModeEnabled: !state.blockModeEnabled })),
    toggleSimpleSpeech: () => update(state => ({ ...state, speechEnabled: !state.speechEnabled })),
    
    applyPreset: (preset: GameModePreset) => {
        const presets: Record<GameModePreset, Partial<GameSettingsState>> = {
            beginner: { gameMode: 'beginner', boardSize: 4, blockModeEnabled: false, autoHideBoard: false, speechEnabled: false, showBoard: true, showPiece: true, showMoves: true, rememberGameMode: true },
            experienced: { gameMode: 'experienced', boardSize: 4, blockModeEnabled: false, autoHideBoard: true, speechEnabled: true, showBoard: true, showPiece: true, showMoves: true, rememberGameMode: true },
            pro: { gameMode: 'pro', boardSize: 4, blockModeEnabled: true, autoHideBoard: true, speechEnabled: true, showBoard: true, showPiece: true, showMoves: true, rememberGameMode: true }
        };
        methods.updateSettings(presets[preset]);
    },
  };

  return {
    subscribe,
    ...methods
  };
}

export const gameSettingsStore = createGameSettingsStore();