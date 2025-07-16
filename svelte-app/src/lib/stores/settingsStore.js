import { writable } from 'svelte/store';

/**
 * @typedef {Object} SettingsState
 * @property {boolean} showMoves
 * @property {boolean} showBoard
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 * @property {boolean} speechEnabled // <-- ДОДАНО
 * @property {string | null} selectedVoiceURI // <-- ДОДАНО
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
  selectedVoiceURI: localStorage.getItem('selectedVoiceURI') || null // <-- ДОДАНО
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
    }
    return merged;
  });
}

function resetSettings() {
  set({ ...defaultSettings });
}

export const settingsStore = {
  subscribe,
  updateSettings,
  resetSettings,
  update,
}; 