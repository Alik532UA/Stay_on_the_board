// src/lib/services/SettingsPersistenceService.ts
import { logService } from './logService';
import { defaultGameSettings, type GameSettingsState } from '../stores/gameSettingsStore.js';

const isBrowser = typeof window !== 'undefined';
const GAME_SETTINGS_KEY = 'gameSettings';
const SETTINGS_VERSION = 2;

const defaultSettings: GameSettingsState & { version: number } = {
  ...defaultGameSettings,
  version: SETTINGS_VERSION,
};

function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    logService.error('Failed to parse JSON from localStorage', e);
    return defaultValue;
  }
}

export const settingsPersistenceService = {
  load(): GameSettingsState {
    if (!isBrowser) return defaultGameSettings;

    try {
      const storedSettingsRaw = localStorage.getItem(GAME_SETTINGS_KEY);
      const storedSettings = safeJsonParse<Partial<GameSettingsState & { version: number }>>(storedSettingsRaw, {});
      
      let mergedSettings = { ...defaultGameSettings, ...storedSettings };

      if (!storedSettings.version || storedSettings.version < SETTINGS_VERSION) {
        // If settings are outdated or version is missing, apply defaults for new/updated properties
        mergedSettings.showGameInfoWidget = defaultGameSettings.showGameInfoWidget;
        mergedSettings.version = SETTINGS_VERSION;
      }
      
      // Remove version before returning the state to avoid polluting the store
      const { version, ...gameSettings } = mergedSettings;

      return gameSettings as GameSettingsState;
    } catch (error) {
      logService.error('Error loading game settings:', error);
      return defaultGameSettings;
    }
  },

  save(settings: GameSettingsState) {
    if (!isBrowser) return;
    
    const stateToPersist = { ...settings, version: SETTINGS_VERSION };

    // Session-specific settings
    if (settings.gameMode) {
      sessionStorage.setItem('gameMode', settings.gameMode);
    } else {
      sessionStorage.removeItem('gameMode');
    }

    logService.state('Saving game settings to localStorage:', stateToPersist);
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(stateToPersist));
  }
};
