import { writable } from 'svelte/store';

/**
 * @typedef {Object} SettingsState
 * @property {boolean} showMoves
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 * @property {string|null} selectedVoiceURI // Додаємо для підтримки вибору голосу
 */

const isBrowser = typeof window !== 'undefined';

const defaultSettings = {
  showMoves: true,
  language: 'uk',
  theme: 'dark',
  style: 'classic',
  selectedVoiceURI: null,
};

if (isBrowser) {
  // Очищаємо старі налаштування теми та стилю, щоб форсувати дефолт
  localStorage.setItem('theme', 'dark');
  localStorage.setItem('style', 'classic');
}

const storedSettings = isBrowser ? {
  showMoves: localStorage.getItem('showMoves') === 'false' ? false : true,
  language: localStorage.getItem('lang') || defaultSettings.language,
  theme: localStorage.getItem('theme') || defaultSettings.theme,
  style: localStorage.getItem('style') || defaultSettings.style,
  selectedVoiceURI: localStorage.getItem('selectedVoiceURI') || null
} : defaultSettings;

const { subscribe, set, update } = writable(storedSettings);

/**
 * @param {Partial<SettingsState>} newSettings
 */
function updateSettings(newSettings) {
  update(state => {
    const merged = { ...state, ...newSettings };
    if (isBrowser) {
      localStorage.setItem('showMoves', merged.showMoves ? 'true' : 'false');
      localStorage.setItem('lang', merged.language);
      localStorage.setItem('theme', merged.theme);
      localStorage.setItem('style', merged.style);
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
  resetSettings
}; 