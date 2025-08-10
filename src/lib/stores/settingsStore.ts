import { writable, get } from 'svelte/store';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/services/speechService.js';
import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
import { locale } from 'svelte-i18n';
import { modalStore } from '$lib/stores/modalStore.js';
import { gameState } from './gameState';
import { logService } from '../services/logService.js';

export type KeybindingAction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'|'confirm'|'no-moves'|'toggle-block-mode'|'toggle-board'|'increase-board'|'decrease-board'|'toggle-speech'|'distance-1'|'distance-2'|'distance-3'|'distance-4'|'distance-5'|'distance-6'|'distance-7'|'distance-8';

export interface SettingsState {
  showMoves: boolean;
  showBoard: boolean;
  language: string;
  theme: string;
  style: string;
  speechEnabled: boolean;
  selectedVoiceURI: string | null;
  blockModeEnabled: boolean;
  showPiece: boolean;
  blockOnVisitCount: number;
  keybindings: Record<KeybindingAction, string[]>;
  keyConflictResolution: Record<string, KeybindingAction>;
  autoHideBoard: boolean;
  gameMode: 'beginner' | 'experienced' | 'pro' | null;
  showGameModeModal: boolean;
  showGameInfoWidget: 'hidden' | 'shown' | 'compact';
  lockSettings: boolean;
}

const isBrowser = typeof window !== 'undefined';
const defaultStyle = import.meta.env.DEV ? 'gray' : 'purple';

/** @type {Record<KeybindingAction, string[]>} */
export const defaultKeybindings = {
  'up-left': ['Numpad7', 'KeyQ'],
  'up': ['Numpad8', 'KeyW'],
  'up-right': ['Numpad9', 'KeyE'],
  'left': ['Numpad4', 'KeyA'],
  'right': ['Numpad6', 'KeyD'],
  'down-left': ['Numpad1', 'KeyZ'],
  'down': ['Numpad2', 'KeyS', 'KeyX'],
  'down-right': ['Numpad3', 'KeyC'],
  'confirm': ['NumpadEnter', 'Enter', 'Space', 'Numpad5', 'KeyS'],
  'no-moves': ['NumpadDecimal', 'Backspace', 'KeyN'],
  'toggle-block-mode': ['NumpadMultiply'],
  'toggle-board': ['NumpadDivide'],
  'increase-board': ['NumpadAdd', 'Equal'],
  'decrease-board': ['NumpadSubtract', 'Minus'],
  'toggle-speech': ['KeyV'],
  'distance-1': ['Digit1'],
  'distance-2': ['Digit2'],
  'distance-3': ['Digit3'],
  'distance-4': ['Digit4'],
  'distance-5': ['Digit5'],
  'distance-6': ['Digit6'],
  'distance-7': ['Digit7'],
  'distance-8': ['Digit8'],
};

const defaultSettings: SettingsState = {
  showMoves: true,
  showBoard: true,
  language: 'uk',
  theme: 'dark',
  style: defaultStyle,
  speechEnabled: false,
  selectedVoiceURI: null,
  blockModeEnabled: false,
  showPiece: true,
  blockOnVisitCount: 0,
  autoHideBoard: false,
  keybindings: defaultKeybindings,
  keyConflictResolution: {},
  gameMode: null,
  showGameModeModal: true,
  showGameInfoWidget: 'shown',
  lockSettings: false,
};

/**
 * @template T
 * @param {string | null} jsonString
 * @param {T} defaultValue
 * @returns {T}
 */
function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * @param {string|null} style
 * @returns {string|null}
 */
const convertStyle = (style: string | null): string | null => {
  if (!style) return null;
  const conversions: { [key: string]: string } = { 'ubuntu': 'purple', 'peak': 'green', 'cs2': 'blue', 'glass': 'gray', 'material': 'orange' };
  return conversions[style] || style;
};

function loadSettings(): SettingsState {
  if (!isBrowser) return defaultSettings;
  
  try {
    const storedKeybindingsRaw = localStorage.getItem('keybindings');
    let storedKeybindings = safeJsonParse<Record<string, string[]>>(storedKeybindingsRaw, {});
    Object.keys(storedKeybindings).forEach(action => {
      const key = action as keyof typeof storedKeybindings;
      if (typeof storedKeybindings[key] === 'string') {
        // @ts-ignore
        storedKeybindings[key] = [storedKeybindings[key]];
      }
    });
  const loadedSettings = {
    showMoves: localStorage.getItem('showMoves') !== 'false',
    showBoard: localStorage.getItem('showBoard') !== 'false',
    language: localStorage.getItem('lang') || defaultSettings.language,
    theme: localStorage.getItem('theme') || defaultSettings.theme,
    style: convertStyle(localStorage.getItem('style')) || defaultSettings.style,
    speechEnabled: localStorage.getItem('speechEnabled') === 'true',
    selectedVoiceURI: localStorage.getItem('selectedVoiceURI') || null,
    blockModeEnabled: localStorage.getItem('blockModeEnabled') === 'true',
    showPiece: localStorage.getItem('showPiece') !== 'false',
    blockOnVisitCount: Number(localStorage.getItem('blockOnVisitCount')) || 0,
    autoHideBoard: localStorage.getItem('autoHideBoard') === 'true',
    keybindings: { ...defaultKeybindings, ...storedKeybindings },
    keyConflictResolution: safeJsonParse(localStorage.getItem('keyConflictResolution'), {}),
    gameMode: localStorage.getItem('gameMode') as 'beginner' | 'experienced' | 'pro' | null,
    showGameModeModal: localStorage.getItem('showGameModeModal') !== 'false',
    showGameInfoWidget: (localStorage.getItem('showGameInfoWidget') as 'hidden' | 'shown' | 'compact') || 'shown',
    lockSettings: localStorage.getItem('lockSettings') === 'true',
  };
  const gameMode = loadedSettings.gameMode;
  return {
      ...loadedSettings,
      gameMode: gameMode === 'beginner' || gameMode === 'experienced' || gameMode === 'pro' ? gameMode : null
  };
  } catch (error) {
    logService.init('Помилка завантаження налаштувань:', error);
    return defaultSettings;
  }
}

function createSettingsStore() {
  const { subscribe, set, update } = writable<SettingsState>(loadSettings());

  const methods = {
    init: () => {
      try {
        if (isBrowser) {
          const settings = loadSettings();
          set(settings);
          subscribe(currentSettings => {
            document.documentElement.setAttribute('data-theme', currentSettings.theme);
            document.documentElement.setAttribute('data-style', currentSettings.style);
          });
        }
        logService.init('settingsStore ініціалізовано успішно');
      } catch (error) {
        logService.init('Помилка ініціалізації settingsStore:', error);
        set(defaultSettings);
      }
    },
    updateSettings: (newSettings: Partial<SettingsState>) => {
      update((state: SettingsState) => {
        const merged = { ...state, ...newSettings };
        if (isBrowser) {
          Object.entries(newSettings).forEach(([key, value]) => {
            const storageKey = key === 'language' ? 'lang' : key;
            if (typeof value === 'object' && value !== null) {
              localStorage.setItem(storageKey, JSON.stringify(value));
            } else if (value !== null && value !== undefined) {
              localStorage.setItem(storageKey, String(value));
            } else {
              localStorage.removeItem(storageKey);
            }
          });
        }
        return merged;
      });
    },
    setVisibilityLevel: (level: number) => {
      let newSettings: Partial<SettingsState> = {};
      switch (level) {
        case 1: newSettings = { showBoard: false, showPiece: false, showMoves: false }; break;
        case 2: newSettings = { showBoard: true, showPiece: false, showMoves: false }; break;
        case 3: newSettings = { showBoard: true, showPiece: true, showMoves: false }; break;
        case 4: newSettings = { showBoard: true, showPiece: true, showMoves: true }; break;
      }
      methods.updateSettings(newSettings);
    },
    resetSettings: () => {
      if (isBrowser) {
        Object.keys(defaultSettings).forEach(key => localStorage.removeItem(key));
        localStorage.setItem('keybindings', JSON.stringify(defaultKeybindings));
      }
      set({ ...defaultSettings });
    },
    resetKeybindings: () => methods.updateSettings({ keybindings: defaultKeybindings }),
    /**
     * @param {string} key
     * @param {KeybindingAction} action
     */
    /**
     * @param {string} key
     * @param {KeybindingAction} action
     */
    resolveKeyConflict: (key: string, action: KeybindingAction) => {
      update((state: SettingsState) => {
        const newResolution = { ...state.keyConflictResolution, [key]: action };
        if (isBrowser) {
          localStorage.setItem('keyConflictResolution', JSON.stringify(newResolution));
        }
        return { ...state, keyConflictResolution: newResolution };
      });
    },
    toggleShowBoard: (forceState: boolean | undefined) => {
      update((state: SettingsState) => {
        const newState = typeof forceState === 'boolean' ? forceState : !state.showBoard;
        const newSettings = { ...state, showBoard: newState };
        if (isBrowser) {
          localStorage.setItem('showBoard', String(newSettings.showBoard));
        }
        return newSettings;
      });
    },
    toggleShowMoves: () => {
      update(state => {
        const newState = !state.showMoves;
        if (isBrowser) localStorage.setItem('showMoves', String(newState));
        return { ...state, showMoves: newState };
      });
    },
    toggleShowPiece: () => {
      update(state => {
        const newShowPieceState = !state.showPiece;
        const newSettings = { ...state, showPiece: newShowPieceState };
        if (!newShowPieceState) {
          newSettings.showMoves = false;
        }
        if (isBrowser) {
          localStorage.setItem('showPiece', String(newSettings.showPiece));
          if (!newShowPieceState) {
            localStorage.setItem('showMoves', String(newSettings.showMoves));
          }
        }
        return newSettings;
      });
    },
    toggleAutoHideBoard: () => {
      update(state => {
        const newState = !state.autoHideBoard;
        if (isBrowser) localStorage.setItem('autoHideBoard', String(newState));
        return { ...state, autoHideBoard: newState };
      });
    },
    setGameInfoWidgetState: (newState: 'hidden' | 'shown' | 'compact') => {
      update((state: SettingsState) => {
        if (isBrowser) localStorage.setItem('showGameInfoWidget', newState);
        return { ...state, showGameInfoWidget: newState };
      });
    },
    toggleBlockMode: () => {
      update((state: SettingsState) => {
        const newState = !state.blockModeEnabled;
        if (isBrowser) localStorage.setItem('blockModeEnabled', String(newState));
        if (newState) {
          gameState.update(gs => {
            const resetHistoryEntry = {
              pos: { row: gs.playerRow, col: gs.playerCol },
              blocked: [] as {row: number, col: number}[],
              visits: {},
              blockModeEnabled: newState
            };
            return {
              ...gs,
              cellVisitCounts: {},
              movesInBlockMode: 0,
              moveHistory: [...gs.moveHistory, resetHistoryEntry]
            };
          });
        }
        return { ...state, blockModeEnabled: newState };
      });
    },
    toggleSpeech: async (desiredState?: boolean) => {
      const currentState = get(settingsStore);
      const isEnabled = typeof desiredState === 'boolean' ? desiredState : !currentState.speechEnabled;
      if (!isEnabled) {
        methods.updateSettings({ speechEnabled: false });
        return;
      }
      const allVoices = await loadAndGetVoices();
      const currentLocale = get(locale) || 'uk';
      const availableVoices = filterVoicesByLang(allVoices, currentLocale);
      const hasConfiguredSpeech = isBrowser && localStorage.getItem('hasConfiguredSpeech') === 'true';
      if (availableVoices.length > 0) {
        if (!hasConfiguredSpeech) {
          openVoiceSettingsModal();
          if (isBrowser) localStorage.setItem('hasConfiguredSpeech', 'true');
        }
        methods.updateSettings({ speechEnabled: true });
      } else {
        openVoiceSettingsModal();
        methods.updateSettings({ speechEnabled: false });
      }
    },
    /**
     * @param {'beginner' | 'experienced' | 'pro'} mode
     * @returns {boolean}
     */
    /**
     * @param {'beginner' | 'experienced' | 'pro'} mode
     * @param {any} [modal=modalStore]
     * @returns {boolean}
     */
    applyGameModePreset: (mode: 'beginner' | 'experienced' | 'pro', modal = modalStore) => {
      let settingsToApply: Partial<SettingsState> = {};
      let showFaq = false;
      switch (mode) {
        case 'beginner':
          settingsToApply = { gameMode: mode, showBoard: true, showPiece: true, showMoves: true, showGameInfoWidget: 'shown', blockModeEnabled: false, speechEnabled: false, autoHideBoard: false };
          showFaq = true;
          break;
        case 'experienced':
          settingsToApply = { gameMode: mode, showBoard: true, showPiece: true, showMoves: true, showGameInfoWidget: 'shown', blockModeEnabled: false, speechEnabled: true, autoHideBoard: true };
          break;
        case 'pro':
          settingsToApply = { gameMode: mode, showBoard: true, showPiece: true, showMoves: true, showGameInfoWidget: 'shown', blockModeEnabled: true, blockOnVisitCount: 0, speechEnabled: true, autoHideBoard: true };
          break;
      }
      methods.updateSettings(settingsToApply);
      modal.closeModal();
      return showFaq;
    }
  };
  return { subscribe, ...methods };
}

export const settingsStore = createSettingsStore();