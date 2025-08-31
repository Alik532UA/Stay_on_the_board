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
import { boardStore } from './boardStore.ts';
import { availableMovesService } from '../services/availableMovesService.ts';

export type KeybindingAction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'|'confirm'|'no-moves'|'toggle-block-mode'|'toggle-board'|'increase-board'|'decrease-board'|'toggle-speech'|'distance-1'|'distance-2'|'distance-3'|'distance-4'|'distance-5'|'distance-6'|'distance-7'|'distance-8'|'auto-hide-board'|'show-help'|'main-menu'|'toggle-theme'|'toggle-language';
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
  speechRate: number;
  speechOrder: 'dir_dist' | 'dist_dir';
  shortSpeech: boolean;
  speechFor: { player: boolean; computer: boolean };
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
        'toggle-speech': ['KeyV'],
        'auto-hide-board': ['Numpad0'],
        'show-help': ['KeyI'],
        'main-menu': ['Escape'],
        'toggle-theme': ['KeyT'],
        'toggle-language': ['KeyL'],
    },
    keyConflictResolution: {},
    gameMode: null,
    rememberGameMode: false,
    showGameModeModal: true,
    showDifficultyWarningModal: true,
    showGameInfoWidget: 'shown',
    lockSettings: false,
    speechRate: 1,
    speechOrder: 'dir_dist',
    shortSpeech: false,
    speechFor: { player: true, computer: true },
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
    toggleBlockMode: () => {
      update(state => ({ ...state, blockModeEnabled: !state.blockModeEnabled }));
      boardStore.resetCellVisitCounts();
      availableMovesService.updateAvailableMoves();
    },
    toggleSimpleSpeech: () => update(state => ({ ...state, speechEnabled: !state.speechEnabled })),
    
    applyPreset: (preset: GameModePreset) => {
        const presets: Record<GameModePreset, Partial<GameSettingsState>> = {
            beginner: { 
                gameMode: 'beginner', 
                blockModeEnabled: false, 
                autoHideBoard: false, 
                speechEnabled: true, 
                rememberGameMode: true,
                speechRate: 1,
                shortSpeech: false,
                speechFor: { player: true, computer: true },
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
            },
            pro: { 
                gameMode: 'pro', 
                blockModeEnabled: true, 
                autoHideBoard: true, 
                speechEnabled: true, 
                rememberGameMode: true,
                speechRate: 1.8,
                shortSpeech: true,
                speechFor: { player: false, computer: true },
            }
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