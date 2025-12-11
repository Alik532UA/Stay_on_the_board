/**
 * @file Manages global application settings.
 * @description This store handles settings that are not tied to a specific game session,
 * such as language, theme, and visual style. The settings are persisted in localStorage.
 */
// src/lib/stores/appSettingsStore.ts
import { writable } from 'svelte/store';
import { logService } from '../services/logService';
import { debounce } from '$lib/utils/debounce';

const isBrowser = typeof window !== 'undefined';

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
    logService.error('Failed to load app settings from localStorage', e);
    return defaultAppSettings;
  }
}

function saveAppSettings(settings: AppSettingsState) {
  if (!isBrowser) return;
  localStorage.setItem('theme', settings.theme);
  localStorage.setItem('style', settings.style);
  localStorage.setItem('language', settings.language);
}

function createAppSettingsStore() {
  const initialState = loadAppSettings();
  const { subscribe, set, update } = writable<AppSettingsState>(initialState);

  return {
    subscribe,
    init: () => {
      const debouncedSave = debounce(saveAppSettings, 300);

      subscribe(currentSettings => {
        document.documentElement.setAttribute('data-theme', currentSettings.theme);
        document.documentElement.setAttribute('data-style', currentSettings.style);
        debouncedSave(currentSettings);
      });
    },
    updateSettings: (newSettings: Partial<AppSettingsState>) => {
      update(state => ({ ...state, ...newSettings }));
    },
    set,
    reset: () => set(defaultAppSettings),
  };
}

export const appSettingsStore = createAppSettingsStore();
