// src/lib/services/SettingsPersistenceService.ts
import { logService } from './logService';

const isBrowser = typeof window !== 'undefined';
const defaultStyle = import.meta.env.DEV ? 'gray' : 'gray';
const SETTINGS_VERSION = 2;

const defaultSettings: any = {
  version: SETTINGS_VERSION,
  showMoves: true,
  showBoard: true,
  language: 'uk',
  theme: 'dark',
  style: defaultStyle,
  speechEnabled: false,
  selectedVoiceURI: null,
  blockModeEnabled: false,
  showPiece: true,
  blockOnVisitCount: 0,
  autoHideBoard: false,
  boardSize: 4,
  keybindings: {
    'up-left': ['Numpad7', 'KeyQ'],
    'up': ['Numpad8', 'KeyW'],
    'up-right': ['Numpad9', 'KeyE'],
    'left': ['Numpad4', 'KeyA'],
    'right': ['Numpad6', 'KeyD'],
    'down-left': ['Numpad1', 'KeyZ'],
    'down': ['Numpad2', 'KeyX'],
    'down-right': ['Numpad3', 'KeyC'],
    'confirm': ['Numpad5', 'Enter', 'Space'],
    'no-moves': ['NumpadDecimal', 'Backspace'],
    'distance-1': ['Digit1'],
    'distance-2': ['Digit2'],
    'distance-3': ['Digit3'],
    'distance-4': ['Digit4'],
    'distance-5': ['Digit5'],
    'distance-6': ['Digit6'],
    'distance-7': ['Digit7'],
    'distance-8': ['Digit8'],
    'toggle-block-mode': ['NumpadMultiply', 'KeyB'],
    'toggle-board': ['NumpadDivide', 'KeyH'],
    'increase-board': ['NumpadAdd', 'Equal'],
    'decrease-board': ['NumpadSubtract', 'Minus'],
    'toggle-speech': ['KeyS'],
  },
  keyConflictResolution: {},
  gameMode: null,
  rememberGameMode: false,
  showGameModeModal: true,
  showDifficultyWarningModal: true,
  showGameInfoWidget: 'shown',
  lockSettings: false,
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

      // ... (вся логіка міграції та об'єднання залишається тут)

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