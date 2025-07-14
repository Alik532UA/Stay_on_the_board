import { writable } from 'svelte/store';

/**
 * @typedef {Object} SettingsState
 * @property {boolean} showMoves
 * @property {string} language
 * @property {string} theme
 * @property {string} style
 */

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const defaultSettings = {
  showMoves: true,
  language: isBrowser ? localStorage.getItem('lang') || 'uk' : 'uk',
  theme: isBrowser ? localStorage.getItem('theme') || 'dark' : 'dark',
  style: isBrowser ? localStorage.getItem('style') || 'classic' : 'classic',
};

const { subscribe, set, update } = writable(/** @type {SettingsState} */ ({ ...defaultSettings }));

/**
 * @param {Partial<SettingsState>} newSettings
 */
function updateSettings(newSettings) {
  update(state => {
    const merged = { ...state, ...newSettings };
    if (isBrowser) {
      localStorage.setItem('lang', merged.language);
      localStorage.setItem('theme', merged.theme);
      localStorage.setItem('style', merged.style);
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