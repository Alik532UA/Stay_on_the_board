import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/speech.js'; // Додано filterVoicesByLang
import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
import { locale } from 'svelte-i18n';

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
 * @property {boolean} showQueen // <-- ІНВЕРТОВАНО
 * @property {number} blockOnVisitCount // <-- ДОДАНО
 */

const isBrowser = typeof window !== 'undefined';

const defaultSettings = {
  showMoves: true,
  showBoard: true,
  language: 'uk',
  theme: 'dark',
  style: 'purple',
  speechEnabled: false, // <-- ДОДАНО
  selectedVoiceURI: null, // <-- ДОДАНО
  blockModeEnabled: false, // <-- ДОДАНО
  showQueen: true, // <-- ІНВЕРТОВАНО
  blockOnVisitCount: 0, // <-- ДОДАНО
};

if (isBrowser) {
  // Очищаємо старі налаштування теми та стилю, щоб форсувати дефолт
  localStorage.setItem('theme', 'dark');
  let style = localStorage.getItem('style');
  if (style === 'ubuntu') style = 'purple';
  if (style === 'peak') style = 'green';
  if (style === 'cs2') style = 'blue';
  if (style === 'glass') style = 'gray';
  if (style === 'material') style = 'orange';
  localStorage.setItem('style', style || 'purple');
}

const storedSettings = isBrowser ? {
  showMoves: localStorage.getItem('showMoves') === 'false' ? false : true,
  showBoard: localStorage.getItem('showBoard') === 'false' ? false : true,
  language: localStorage.getItem('lang') || defaultSettings.language,
  theme: localStorage.getItem('theme') || defaultSettings.theme,
  style: (() => {
    let style = localStorage.getItem('style');
    if (style === 'ubuntu') style = 'purple';
    if (style === 'peak') style = 'green';
    if (style === 'cs2') style = 'blue';
    if (style === 'glass') style = 'gray';
    if (style === 'material') style = 'orange';
    return style || defaultSettings.style;
  })(),
  speechEnabled: localStorage.getItem('speechEnabled') === 'true', // <-- ДОДАНО
  selectedVoiceURI: localStorage.getItem('selectedVoiceURI') || null, // <-- ДОДАНО
  blockModeEnabled: localStorage.getItem('blockModeEnabled') === 'true' ? true : false, // <-- ДОДАНО
  showQueen: localStorage.getItem('showQueen') === 'false' ? false : true, // <-- ІНВЕРТОВАНО
  blockOnVisitCount: parseInt(localStorage.getItem('blockOnVisitCount') || '0', 10), // <-- ДОДАНО
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
      localStorage.setItem('showQueen', String(merged.showQueen)); // <-- ІНВЕРТОВАНО
      if (merged.blockOnVisitCount !== undefined) {
        localStorage.setItem('blockOnVisitCount', String(merged.blockOnVisitCount));
      }
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
 * Інтелектуально перемикає озвучування ходів.
 * @param {boolean=} desiredState - Бажаний стан (true для увімкнення, false для вимкнення). Якщо не передано — інвертує поточний.
 */
export async function toggleSpeech(desiredState) {
  const isBrowser = typeof window !== 'undefined';
  if (typeof desiredState === 'undefined') {
    desiredState = !get(settingsStore).speechEnabled;
  }

  // Якщо користувач хоче вимкнути, просто вимикаємо.
  if (!desiredState) {
    updateSettings({ speechEnabled: false });
    return;
  }

  // Логіка для УВІМКНЕННЯ (desiredState === true)
  const allVoices = await loadAndGetVoices();
  const currentLocale = get(locale) || 'uk';
  const availableVoices = filterVoicesByLang(allVoices, currentLocale);

  const hasConfiguredSpeech = isBrowser && localStorage.getItem('hasConfiguredSpeech') === 'true';

  // Якщо голоси є
  if (availableVoices.length > 0) {
    if (!hasConfiguredSpeech) {
      openVoiceSettingsModal();
      if (isBrowser) localStorage.setItem('hasConfiguredSpeech', 'true');
    }
    // Дозволяємо увімкнення
    updateSettings({ speechEnabled: true });
  } 
  // Якщо голосів немає
  else {
    openVoiceSettingsModal();
    // Забороняємо увімкнення, повертаючи стан назад на false
    updateSettings({ speechEnabled: false });
  }
}

export const settingsStore = {
  subscribe,
  updateSettings,
  resetSettings,
  update,
};

/**
 * Перемикає видимість ферзя
 */
export function toggleShowQueen() {
  const prev = get(settingsStore);
  const newShowQueenState = !(prev.showQueen ?? true);
  // Якщо ми ховаємо ферзя (тобто newShowQueenState === false), вимикаємо показ ходів.
  if (!newShowQueenState) {
    updateSettings({ showQueen: newShowQueenState, showMoves: false });
  } else {
    updateSettings({ showQueen: newShowQueenState });
  }
} 