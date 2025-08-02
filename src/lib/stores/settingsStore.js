import { writable, get } from 'svelte/store';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/services/speechService.js';
import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
import { locale } from 'svelte-i18n';
import { modalStore } from '$lib/stores/modalStore.js';
import { gameState } from './gameState'; // <-- 1. Імпортуй gameState

/**
 * @typedef {Object} SettingsState
 * @property {boolean} showMoves
 * @property {boolean} showBoard
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 * @property {boolean} speechEnabled
 * @property {string | null} selectedVoiceURI
 * @property {boolean} blockModeEnabled
 * @property {boolean} showQueen
 * @property {number} blockOnVisitCount
 * @property {Record<string, string[]>} keybindings
 * @property {Record<string, string>} keyConflictResolution
 * @property {boolean} autoHideBoard
 * @property {'beginner' | 'experienced' | 'pro' | null} gameMode
 * @property {boolean} showGameModeModal
 */

const isBrowser = typeof window !== 'undefined';
const defaultStyle = import.meta.env.DEV ? 'gray' : 'purple';

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

/** @type {SettingsState} */
const defaultSettings = {
  showMoves: true,
  showBoard: true,
  language: 'uk',
  theme: 'dark',
  style: defaultStyle,
  speechEnabled: false,
  selectedVoiceURI: null,
  blockModeEnabled: false,
  showQueen: true,
  blockOnVisitCount: 0,
  autoHideBoard: false,
  keybindings: defaultKeybindings,
  keyConflictResolution: {},
  gameMode: null,
  showGameModeModal: true,
};

/** @param {string | null} jsonString @param {any} defaultValue */
function safeJsonParse(jsonString, defaultValue) {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * @param {string|null} style
 * @returns {string|null}
 */
const convertStyle = (style) => {
  if (!style) return null;
  /** @type {{ [key: string]: string }} */
  const conversions = { 'ubuntu': 'purple', 'peak': 'green', 'cs2': 'blue', 'glass': 'gray', 'material': 'orange' };
  return conversions[style] || style;
};

/** @returns {SettingsState} */
function loadSettings() {
  if (!isBrowser) return defaultSettings;
  
  try {
    const storedKeybindingsRaw = localStorage.getItem('keybindings');
    let storedKeybindings = safeJsonParse(storedKeybindingsRaw, {});
    Object.keys(storedKeybindings).forEach(action => {
    if (typeof storedKeybindings[action] === 'string') {
      storedKeybindings[action] = [storedKeybindings[action]];
    }
  });
  return {
    showMoves: localStorage.getItem('showMoves') !== 'false',
    showBoard: localStorage.getItem('showBoard') !== 'false',
    language: localStorage.getItem('lang') || defaultSettings.language,
    theme: localStorage.getItem('theme') || defaultSettings.theme,
    style: convertStyle(localStorage.getItem('style')) || defaultSettings.style,
    speechEnabled: localStorage.getItem('speechEnabled') === 'true',
    selectedVoiceURI: localStorage.getItem('selectedVoiceURI') || null,
    blockModeEnabled: localStorage.getItem('blockModeEnabled') === 'true',
    showQueen: localStorage.getItem('showQueen') !== 'false',
    blockOnVisitCount: Number(localStorage.getItem('blockOnVisitCount')) || 0,
    autoHideBoard: localStorage.getItem('autoHideBoard') === 'true',
    keybindings: { ...defaultKeybindings, ...storedKeybindings },
    keyConflictResolution: safeJsonParse(localStorage.getItem('keyConflictResolution'), {}),
    gameMode: ((() => {
      const gm = localStorage.getItem('gameMode');
      return gm === 'beginner' || gm === 'experienced' || gm === 'pro' ? gm : null;
    })()),
    showGameModeModal: localStorage.getItem('showGameModeModal') !== 'false', // Defaults to true if null
  };
  } catch (error) {
    console.error('❌ Помилка завантаження налаштувань:', error);
    return defaultSettings;
  }
}

function createSettingsStore() {
  const { subscribe, set, update } = writable(defaultSettings);

  const methods = {
    init: () => {
      try {
        if (isBrowser) {
          const settings = loadSettings();
          update(current => ({ ...settings, gameMode: current.gameMode ?? settings.gameMode }));
          subscribe(currentSettings => {
            document.documentElement.setAttribute('data-theme', currentSettings.theme);
            document.documentElement.setAttribute('data-style', currentSettings.style);
          });
        }
        console.log('✅ settingsStore ініціалізовано успішно');
      } catch (error) {
        console.error('❌ Помилка ініціалізації settingsStore:', error);
        // Використовуємо налаштування за замовчуванням при помилці
        set(defaultSettings);
      }
    },
    updateSettings: (/** @type {Partial<SettingsState>} */ newSettings) => {
      update(state => {
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
    resetSettings: () => {
      if (isBrowser) {
        Object.keys(defaultSettings).forEach(key => localStorage.removeItem(key));
        localStorage.setItem('keybindings', JSON.stringify(defaultKeybindings));
      }
      set({ ...defaultSettings });
    },
    resetKeybindings: () => methods.updateSettings({ keybindings: defaultKeybindings }),
    resolveKeyConflict: (/** @type {string} */ key, /** @type {string} */ action) => {
      update(state => {
        const newResolution = { ...state.keyConflictResolution, [key]: action };
        if (isBrowser) {
          localStorage.setItem('keyConflictResolution', JSON.stringify(newResolution));
        }
        return { ...state, keyConflictResolution: newResolution };
      });
    },
    toggleShowBoard: (/** @type {boolean|undefined} */ forceState) => {
      update(state => {
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
    toggleShowQueen: () => {
      update(state => {
        const newShowQueenState = !state.showQueen;
        const newSettings = { ...state, showQueen: newShowQueenState };

        // Якщо ховаємо ферзя, ховаємо і його ходи
        if (!newShowQueenState) {
          newSettings.showMoves = false;
        }

        if (isBrowser) {
          localStorage.setItem('showQueen', String(newSettings.showQueen));
          // Оновлюємо showMoves тільки якщо він змінився
          if (!newShowQueenState) {
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
    toggleBlockMode: () => {
      update(state => {
        const newState = !state.blockModeEnabled;
        if (isBrowser) localStorage.setItem('blockModeEnabled', String(newState));

        // Якщо ми ВМИКАЄМО режим, скидаємо лічильники та додаємо запис про очищення до історії
        if (newState) {
          gameState.update(gs => {
            // Створюємо новий запис для історії, що фіксує очищення дошки
            /** @type {{ pos: { row: number, col: number }, blocked: any[], visits: {}, blockModeEnabled: boolean }} */
            const resetHistoryEntry = { 
              pos: { row: gs.playerRow, col: gs.playerCol }, 
              blocked: [], 
              visits: {}, // <-- Ключовий момент: порожній об'єкт відвідувань
              blockModeEnabled: newState // <-- ДОДАЙ ЦЕЙ РЯДОК
            };

            return {
              ...gs,
              cellVisitCounts: {},
              movesInBlockMode: 0,
              // Додаємо новий запис до існуючої історії
              moveHistory: [...gs.moveHistory, resetHistoryEntry]
            };
          });
        }

        return { ...state, blockModeEnabled: newState };
      });
    },
    /**
     * @param {boolean=} desiredState
     */
    toggleSpeech: async (desiredState) => {
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
     * @returns {boolean} чи потрібно показати FAQ
     */
    applyGameModePreset: (mode, modal = modalStore) => {
      /** @type {Partial<SettingsState>} */
      let settingsToApply = { gameMode: mode };
      let showFaq = false;
      switch (mode) {
        case 'beginner':
          settingsToApply = { gameMode: mode, showBoard: true, showQueen: true, showMoves: true, blockModeEnabled: false, speechEnabled: false, autoHideBoard: false };
          showFaq = true;
          break;
        case 'experienced':
          settingsToApply = { gameMode: mode, showBoard: true, showQueen: true, showMoves: true, blockModeEnabled: false, speechEnabled: true, autoHideBoard: true };
          break;
        case 'pro':
          settingsToApply = { gameMode: mode, showBoard: true, showQueen: true, showMoves: true, blockModeEnabled: true, blockOnVisitCount: 0, speechEnabled: true, autoHideBoard: true };
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