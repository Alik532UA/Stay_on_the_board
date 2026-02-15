/**
 * @file Manages global application settings.
 * @description This store handles settings that are not tied to a specific game session.
 * Bridge pattern: writable-обгортка для Svelte 4.
 * SSoT — appSettingsState.svelte.ts (Runes).
 */
// src/lib/stores/appSettingsStore.ts
import { writable } from 'svelte/store';
import { logService } from '../services/logService';
import { debounce } from '$lib/utils/debounce';
import { AppSettingsSchema, type AppSettings } from '$lib/schemas/appSettingsSchema';
import { appSettingsState } from './appSettingsState.svelte';

const isBrowser = typeof window !== 'undefined';

export type AppSettingsState = AppSettings;

export const defaultAppSettings: AppSettingsState = {
  language: 'uk',
  theme: 'dark',
  style: 'gray',
};

function loadAppSettings(): AppSettingsState {
  if (!isBrowser) return defaultAppSettings;
  try {
    const rawSettings: Record<string, string | null> = {
      theme: localStorage.getItem('theme'),
      style: localStorage.getItem('style'),
      language: localStorage.getItem('language'),
    };

    const filteredSettings = Object.fromEntries(
      Object.entries(rawSettings).filter(([_, v]) => v !== null)
    );

    const result = AppSettingsSchema.safeParse(filteredSettings);
    if (result.success) {
      return result.data;
    } else {
      logService.error('App settings validation failed, using defaults:', result.error.format());
      return defaultAppSettings;
    }
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

// Ініціалізація SSoT з localStorage
appSettingsState.state = loadAppSettings();

function createAppSettingsStore() {
  const { subscribe, set: svelteSet } = writable<AppSettingsState>(appSettingsState.state);

  const syncStore = () => { svelteSet(appSettingsState.state); };

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
      appSettingsState.updateSettings(newSettings);
      syncStore();
    },
    set: (value: AppSettingsState) => {
      appSettingsState.state = value;
      syncStore();
    },
    reset: () => {
      appSettingsState.reset();
      syncStore();
    },
  };
}

export const appSettingsStore = createAppSettingsStore();
