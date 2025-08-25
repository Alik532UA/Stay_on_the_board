import { writable, get } from 'svelte/store';
import { gameState } from './gameState';
import { logService } from '../services/logService.js';
import { settingsPersistenceService } from '../services/SettingsPersistenceService';

export type KeybindingAction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'|'confirm'|'no-moves'|'toggle-block-mode'|'toggle-board'|'increase-board'|'decrease-board'|'toggle-speech'|'distance-1'|'distance-2'|'distance-3'|'distance-4'|'distance-5'|'distance-6'|'distance-7'|'distance-8';

const isBrowser = typeof window !== 'undefined';
let isInitialized = false;

function createSettingsStore() {
  const initialState = settingsPersistenceService.load();
  const { subscribe, set, update } = writable<any>(initialState);

  const methods = {
    init: () => {
      if (isInitialized || !isBrowser) return;
      isInitialized = true;

      try {
        const settings = settingsPersistenceService.load();
        set(settings);
        
        subscribe(currentSettings => {
          document.documentElement.setAttribute('data-theme', currentSettings.theme);
          document.documentElement.setAttribute('data-style', currentSettings.style);
          settingsPersistenceService.save(currentSettings);
        });

        gameState.subscribe(state => {
          if (state && state.isNewGame) {
            methods.updateSettings({ showBoard: true, showPiece: true, showMoves: true });
          }
        });
        logService.init('settingsStore ініціалізовано успішно');
      } catch (error) {
        logService.init('Помилка ініціалізації settingsStore:', error);
      }
    },
    updateSettings: (newSettings: Partial<any>) => {
      update(state => ({ ...state, ...newSettings }));
    },
    resetSettings: () => {
      if (isBrowser) {
        localStorage.removeItem('settings');
      }
      const newDefaults = settingsPersistenceService.load();
      set(newDefaults);
    },
    resetKeybindings: () => {
      update(state => {
        const newKeybindings = settingsPersistenceService.load().keybindings;
        return { ...state, keybindings: newKeybindings };
      });
    },
    toggleShowBoard: (forceState?: boolean) => {
      update((state: any) => {
        const newShowBoardState = typeof forceState === 'boolean' ? forceState : !state.showBoard;
        const newSettings = { ...state, showBoard: newShowBoardState };
        if (!newShowBoardState) {
          newSettings.showPiece = false;
          newSettings.showMoves = false;
        }
        return newSettings;
      });
    },
    toggleShowMoves: () => update(state => ({ ...state, showMoves: !state.showMoves })),
    toggleShowPiece: () => {
      update(state => {
        const newShowPieceState = !state.showPiece;
        const newSettings = { ...state, showPiece: newShowPieceState };
        if (!newShowPieceState) {
          newSettings.showMoves = false;
        }
        return newSettings;
      });
    },
    toggleAutoHideBoard: () => update(state => ({ ...state, autoHideBoard: !state.autoHideBoard })),
    setGameInfoWidgetState: (newState: 'hidden' | 'shown' | 'compact') => update(state => ({ ...state, showGameInfoWidget: newState })),
    toggleBlockMode: () => update(state => ({ ...state, blockModeEnabled: !state.blockModeEnabled })),
    toggleSimpleSpeech: () => update(state => ({ ...state, speechEnabled: !state.speechEnabled })),
    applyPreset: (preset: 'beginner' | 'experienced' | 'pro') => {
        const presets = {
            beginner: { gameMode: 'training', boardSize: 3, blockModeEnabled: false },
            experienced: { gameMode: 'local', boardSize: 4, blockModeEnabled: true },
            pro: { gameMode: 'timed', boardSize: 5, blockModeEnabled: true }
        };
        methods.updateSettings(presets[preset]);
    },
  };

  return {
    subscribe,
    ...methods
  };
}

export const settingsStore = createSettingsStore();