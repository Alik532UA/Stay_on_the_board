// src/lib/services/SettingsPersistenceService.ts
import { logService } from './logService';
import { defaultGameSettings } from '../stores/gameSettingsStore.js';

const isBrowser = typeof window !== 'undefined';
const defaultStyle = import.meta.env.DEV ? 'gray' : 'gray';
const SETTINGS_VERSION = 2;

const defaultSettings: any = {
  ...defaultGameSettings,
  version: SETTINGS_VERSION,
  language: 'uk',
  theme: 'dark',
  style: defaultStyle,
};

function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

const convertStyle = (style: string | null): string | null => {
  if (!style) return null;
  const conversions: { [key: string]: string } = { 'ubuntu': 'purple', 'peak': 'green', 'cs2': 'blue', 'glass': 'gray', 'material': 'orange' };
  return conversions[style] || style;
};

export const settingsPersistenceService = {
  load(): any {
    if (!isBrowser) return defaultSettings;

    try {
      const storedSettingsRaw = localStorage.getItem('settings');
      const sessionGameMode = isBrowser ? sessionStorage.getItem('gameMode') : null;
      const storedSettings: any = safeJsonParse(storedSettingsRaw, {});
      
      let mergedSettings = { ...defaultSettings, ...storedSettings };

      if (storedSettings.version < SETTINGS_VERSION) {
        mergedSettings.showGameInfoWidget = defaultSettings.showGameInfoWidget;
        mergedSettings.version = SETTINGS_VERSION;
      }

      return mergedSettings;
    } catch (error) {
      logService.init('Помилка завантаження налаштувань:', error);
      return defaultSettings;
    }
  },

  save(settings: any) {
    if (!isBrowser) return;
    
    const persistentState = { ...settings };
    if (settings.rememberGameMode) {
      persistentState.gameMode = settings.gameMode;
    } else {
      persistentState.gameMode = null;
    }

    if (settings.gameMode) {
      sessionStorage.setItem('gameMode', settings.gameMode);
    } else {
      sessionStorage.removeItem('gameMode');
    }

    logService.state('Стан для збереження в localStorage:', persistentState);
    localStorage.setItem('settings', JSON.stringify(persistentState));
  }
};