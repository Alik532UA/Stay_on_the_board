/**
 * @file Manages global application settings.
 * @description This store handles settings that are not tied to a specific game session,
 * such as language, theme, and visual style. The settings are persisted in localStorage.
 */
// src/lib/stores/appSettingsStore.ts
import { writable } from 'svelte/store';
import { logService } from '../services/logService';

const isBrowser = typeof window !== 'undefined';
let isInitialized = false;

export type AppSettingsState = {
  language: string;
  theme: string;
  style: string;
};

export const defaultAppSettings: AppSettingsState = {
  language: 'uk',
  theme: 'dark',
  style: 'gray',
};

function loadAppSettings(): AppSettingsState {
  if (!isBrowser) return defaultAppSettings;
  try {
    const theme = localStorage.getItem('theme') || defaultAppSettings.theme;
    const style = localStorage.getItem('style') || defaultAppSettings.style;
    const language = localStorage.getItem('language') || defaultAppSettings.language;
    return { theme, style, language };
  } catch (e) {
    logService.init('Failed to load app settings from localStorage', e);
    return defaultAppSettings;
  }
}

function saveAppSettings(settings: AppSettingsState) {
  if (!isBrowser) return;
  localStorage.setItem('theme', settings.theme);
  localStorage.setItem('style', settings.style);
  localStorage.setItem('language', settings.language);
  logService.state('[AppSettingsStore] Стан збережено в localStorage:', settings);
}

function createAppSettingsStore() {
  const initialState = loadAppSettings();
  const { subscribe, set, update } = writable<AppSettingsState>(initialState);

  return {
    subscribe,
    init: () => {
      if (isInitialized || !isBrowser) return;
      isInitialized = true;
      const settings = loadAppSettings();
      set(settings);
      
      subscribe(currentSettings => {
        document.documentElement.setAttribute('data-theme', currentSettings.theme);
        document.documentElement.setAttribute('data-style', currentSettings.style);
        saveAppSettings(currentSettings);
      });
      logService.init('appSettingsStore ініціалізовано успішно');
    },
    updateSettings: (newSettings: Partial<AppSettingsState>) => {
      update(state => ({ ...state, ...newSettings }));
    },
    reset: () => set(defaultAppSettings),
  };
}

export const appSettingsStore = createAppSettingsStore();