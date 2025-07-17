import { writable } from 'svelte/store';
import { get } from 'svelte/store';

/**
 * @typedef {Object} SettingsState
 * @property {boolean} showMoves
 * @property {boolean} showBoard
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 * @property {boolean} speechEnabled // <-- ДОДАНО
 * @property {string | null} selectedVoiceURI // <-- ДОДАНО
 * @property {boolean} blockModeEnabled // <-- ДОДАНО
 */

const isBrowser = typeof window !== 'undefined';

const defaultSettings = {
  showMoves: true,
  showBoard: true,
  language: 'uk',
  theme: 'dark',
  style: 'ubuntu',
  speechEnabled: false, // <-- ДОДАНО
  selectedVoiceURI: null, // <-- ДОДАНО
  blockModeEnabled: false, // <-- ДОДАНО
};

if (isBrowser) {
  // Очищаємо старі налаштування теми та стилю, щоб форсувати дефолт
  localStorage.setItem('theme', 'dark');
  localStorage.setItem('style', 'ubuntu');
}

const storedSettings = isBrowser ? {
  showMoves: localStorage.getItem('showMoves') === 'false' ? false : true,
  showBoard: localStorage.getItem('showBoard') === 'false' ? false : true,
  language: localStorage.getItem('lang') || defaultSettings.language,
  theme: localStorage.getItem('theme') || defaultSettings.theme,
  style: localStorage.getItem('style') || defaultSettings.style,
  speechEnabled: localStorage.getItem('speechEnabled') === 'true', // <-- ДОДАНО
  selectedVoiceURI: localStorage.getItem('selectedVoiceURI') || null, // <-- ДОДАНО
  blockModeEnabled: localStorage.getItem('blockModeEnabled') === 'true' ? true : false, // <-- ДОДАНО
} : defaultSettings;

const { subscribe, set, update } = writable(storedSettings);

// Реактивно оновлюємо data-theme та data-style на <html> при зміні
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
      localStorage.setItem('showMoves', merged.showMoves ? 'true' : 'false');
      localStorage.setItem('showBoard', merged.showBoard ? 'true' : 'false');
      localStorage.setItem('lang', merged.language);
      localStorage.setItem('theme', merged.theme);
      localStorage.setItem('style', merged.style);
      localStorage.setItem('speechEnabled', String(merged.speechEnabled)); // <-- ДОДАНО
      if (merged.selectedVoiceURI) {
        localStorage.setItem('selectedVoiceURI', merged.selectedVoiceURI);
      } else {
        localStorage.removeItem('selectedVoiceURI');
      }
      localStorage.setItem('blockModeEnabled', String(merged.blockModeEnabled)); // <-- ДОДАНО
    }
    return merged;
  });
}

function resetSettings() {
  set({ ...defaultSettings });
}

/**
 * Перемикає видимість дошки
 */
export function toggleShowBoard() {
  const prev = get(settingsStore);
  updateSettings({ showBoard: !(prev.showBoard ?? true) });
}

/**
 * Перемикає видимість підсвічування ходів
 */
export function toggleShowMoves() {
  const prev = get(settingsStore);
  updateSettings({ showMoves: !(prev.showMoves ?? true) });
}

/**
 * Перемикає озвучування ходів
 */
export function toggleSpeech() {
  const prev = get(settingsStore);
  updateSettings({ speechEnabled: !(prev.speechEnabled ?? false) });
}

/**
 * Перемикає режим блокування клітинок
 */
export function toggleBlockMode() {
  const prev = get(settingsStore);
  updateSettings({ blockModeEnabled: !(prev.blockModeEnabled ?? false) });
}

export const settingsStore = {
  subscribe,
  updateSettings,
  resetSettings,
  update,
}; 