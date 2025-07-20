import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/speech.js';
import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
import { locale } from 'svelte-i18n';

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
  keybindings: defaultKeybindings,
  keyConflictResolution: {},
};

/**
 * @param {string | null} jsonString
 * @param {any} defaultValue
 */
function safeJsonParse(jsonString, defaultValue) {
  if (!jsonString) {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('Failed to parse JSON string from localStorage, returning default value.', e);
    return defaultValue;
  }
}

/** @returns {SettingsState} */
function loadSettings() {
  if (!isBrowser) return defaultSettings;
  try {
    const storedKeybindingsRaw = localStorage.getItem('keybindings');
    let storedKeybindings = safeJsonParse(storedKeybindingsRaw, {});
    // Зворотна сумісність: якщо значення не масив — обгортаємо у масив
    Object.keys(storedKeybindings).forEach(action => {
      if (typeof storedKeybindings[action] === 'string') {
        storedKeybindings[action] = [storedKeybindings[action]];
      }
    });
    const stored = {
      showMoves: localStorage.getItem('showMoves') === 'true',
      showBoard: localStorage.getItem('showBoard') !== 'false',
      language: localStorage.getItem('lang') || defaultSettings.language,
      theme: localStorage.getItem('theme') || defaultSettings.theme,
      style: convertStyle(localStorage.getItem('style')) || defaultSettings.style,
      speechEnabled: localStorage.getItem('speechEnabled') === 'true',
      selectedVoiceURI: localStorage.getItem('selectedVoiceURI') || null,
      blockModeEnabled: localStorage.getItem('blockModeEnabled') === 'true',
      showQueen: localStorage.getItem('showQueen') !== 'false',
      blockOnVisitCount: Number(localStorage.getItem('blockOnVisitCount')) || 0,
      keybindings: { ...defaultKeybindings, ...storedKeybindings },
      keyConflictResolution: safeJsonParse(localStorage.getItem('keyConflictResolution'), {}),
    };
    return stored;
  } catch (e) {
    console.error("Failed to load settings, falling back to default.", e);
    return defaultSettings;
  }
}

/**
 * @param {string|null} style
 * @returns {string|null}
 */
const convertStyle = (style) => {
  if (!style) return null;
  /** @type {{ [key: string]: string }} */
  const conversions = {
    'ubuntu': 'purple', 'peak': 'green', 'cs2': 'blue',
    'glass': 'gray', 'material': 'orange'
  };
  return conversions[style] || style;
};

const { subscribe, set, update } = writable(loadSettings());

if (isBrowser) {
  subscribe(settings => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-style', settings.style);
  });
}

/**
 * @param {Partial<SettingsState>} newSettings
 */
function updateSettings(newSettings) {
  update(state => {
    const merged = { ...state, ...newSettings };
    if (isBrowser) {
      Object.entries(merged).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          localStorage.setItem(key, JSON.stringify(value));
        } else if (key === 'language') {
          localStorage.setItem('lang', String(value));
        } else if (value !== null && value !== undefined) {
          localStorage.setItem(key, String(value));
        } else {
          localStorage.removeItem(key);
        }
      });
    }
    return merged;
  });
}

function resetSettings() {
  set({ ...defaultSettings });
  if(isBrowser) {
    Object.keys(defaultSettings).forEach(key => localStorage.removeItem(key));
    localStorage.setItem('keybindings', JSON.stringify(defaultKeybindings));
  }
}

function resetKeybindings() {
  updateSettings({ keybindings: defaultKeybindings });
}

export const settingsStore = {
  subscribe,
  updateSettings,
  resetSettings,
  resetKeybindings,
  update,
};

export function toggleShowBoard() {
  const prev = get(settingsStore);
  updateSettings({ showBoard: !(prev.showBoard ?? true) });
}

export function toggleShowMoves() {
  const prev = get(settingsStore);
  updateSettings({ showMoves: !(prev.showMoves ?? true) });
}

/**
 * Інтелектуально перемикає озвучування ходів.
 * @param {boolean=} desiredState - Бажаний стан (true для увімкнення, false для вимкнення). Якщо не передано — інвертує поточний.
 */
export async function toggleSpeech(desiredState /**: boolean | undefined */) {
  const isBrowser = typeof window !== 'undefined';
  if (typeof desiredState === 'undefined') {
    desiredState = !get(settingsStore).speechEnabled;
  }
  if (!desiredState) {
    updateSettings({ speechEnabled: false });
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
    updateSettings({ speechEnabled: true });
  } 
  else {
    openVoiceSettingsModal();
    updateSettings({ speechEnabled: false });
  }
}

export function toggleShowQueen() {
  const prev = get(settingsStore);
  const newShowQueenState = !(prev.showQueen ?? true);
  if (!newShowQueenState) {
    updateSettings({ showQueen: newShowQueenState, showMoves: false });
  } else {
    updateSettings({ showQueen: newShowQueenState });
  }
} 