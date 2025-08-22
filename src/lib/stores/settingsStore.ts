import { writable, get } from 'svelte/store';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/services/speechService.js';
import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
import { locale } from 'svelte-i18n';
import { modalStore } from '$lib/stores/modalStore.js';
import { gameState } from './gameState';
import { logService } from '../services/logService.js';

export type KeybindingAction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'|'confirm'|'no-moves'|'toggle-block-mode'|'toggle-board'|'increase-board'|'decrease-board'|'toggle-speech'|'distance-1'|'distance-2'|'distance-3'|'distance-4'|'distance-5'|'distance-6'|'distance-7'|'distance-8';

const isBrowser = typeof window !== 'undefined';
const defaultStyle = import.meta.env.DEV ? 'gray' : 'purple';
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
  showExpertModeWarningModal: true,
  showGameInfoWidget: 'shown',
  lockSettings: false,
  testMode: false,
};

/**
 * @template T
 * @param {string | null} jsonString
 * @param {T} defaultValue
 * @returns {T}
 */
function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * @param {string|null} style
 * @returns {string|null}
 */
const convertStyle = (style: string | null): string | null => {
  if (!style) return null;
  const conversions: { [key: string]: string } = { 'ubuntu': 'purple', 'peak': 'green', 'cs2': 'blue', 'glass': 'gray', 'material': 'orange' };
  return conversions[style] || style;
};

function loadSettings(): any {
  if (!isBrowser) return defaultSettings;

  try {
    const storedSettingsRaw = localStorage.getItem('settings');
    const sessionGameMode = isBrowser ? sessionStorage.getItem('gameMode') : null;
    logService.init('Завантажено raw налаштування з localStorage:', storedSettingsRaw);
    const storedSettings: { version?: number; keybindings?: Record<string, string[]> } = safeJsonParse(storedSettingsRaw, {});
    logService.init('Розпарсені налаштування:', storedSettings);
    const settingsVersion = storedSettings.version || 0;

    let mergedSettings = { ...defaultSettings, ...storedSettings };

    if (settingsVersion < SETTINGS_VERSION) {
      const defaultKeybindings = defaultSettings.keybindings;
      const storedKeybindings = storedSettings.keybindings || {};
      
      const mergedKeybindings = { ...defaultKeybindings };

      for (const action in defaultKeybindings) {
        if (storedKeybindings[action]) {
          const uniqueKeys = [...new Set([...defaultKeybindings[action], ...storedKeybindings[action]])];
          mergedKeybindings[action] = uniqueKeys;
        }
      }
       for (const action in storedKeybindings) {
        if (!mergedKeybindings[action]) {
          mergedKeybindings[action] = storedKeybindings[action];
        }
      }

      mergedSettings.keybindings = mergedKeybindings;
      mergedSettings.version = SETTINGS_VERSION;
    }
    
    const legacyKeybindingsRaw = localStorage.getItem('keybindings');
    if (legacyKeybindingsRaw) {
        const legacyKeybindings: Record<string, string[]> = safeJsonParse(legacyKeybindingsRaw, {});
        for (const action in legacyKeybindings) {
            if (mergedSettings.keybindings[action]) {
                const uniqueKeys = [...new Set([...mergedSettings.keybindings[action], ...legacyKeybindings[action]])];
                mergedSettings.keybindings[action] = uniqueKeys;
            } else {
                mergedSettings.keybindings[action] = legacyKeybindings[action];
            }
        }
        localStorage.removeItem('keybindings');
    }

    // Ensure all keybindings are arrays
    Object.keys(mergedSettings.keybindings).forEach(action => {
      const key = action as keyof typeof mergedSettings.keybindings;
      if (typeof mergedSettings.keybindings[key] === 'string') {
        // @ts-ignore
        mergedSettings.keybindings[key] = [mergedSettings.keybindings[key]];
      }
    });

    const gameMode = mergedSettings.gameMode;
    mergedSettings.gameMode = ['beginner', 'experienced', 'pro'].includes(gameMode) ? gameMode : sessionGameMode;
    
    // Migrate individual settings from localStorage to the new 'settings' object
    const individualSettingsMap = {
      showMoves: 'showMoves',
      showBoard: 'showBoard',
      lang: 'language',
      theme: 'theme',
      style: 'style',
      speechEnabled: 'speechEnabled',
      selectedVoiceURI: 'selectedVoiceURI',
      blockModeEnabled: 'blockModeEnabled',
      showPiece: 'showPiece',
      blockOnVisitCount: 'blockOnVisitCount',
      autoHideBoard: 'autoHideBoard',
      keyConflictResolution: 'keyConflictResolution',
      gameMode: 'gameMode',
      rememberGameMode: 'rememberGameMode',
      showGameModeModal: 'showGameModeModal',
      showDifficultyWarningModal: 'showDifficultyWarningModal',
      showExpertModeWarningModal: 'showExpertModeWarningModal',
      showGameInfoWidget: 'showGameInfoWidget',
      lockSettings: 'lockSettings',
      testMode: 'testMode'
    };

    let hasMigrated = false;
    for (const [storageKey, settingsKey] of Object.entries(individualSettingsMap)) {
      const storedValue = localStorage.getItem(storageKey);
      if (storedValue !== null) {
        hasMigrated = true;
        switch (settingsKey) {
          case 'showMoves':
          case 'showBoard':
          case 'speechEnabled':
          case 'blockModeEnabled':
          case 'showPiece':
          case 'autoHideBoard':
          case 'showGameModeModal':
          case 'rememberGameMode':
          case 'showDifficultyWarningModal':
          case 'showExpertModeWarningModal':
          case 'lockSettings':
          case 'testMode':
            // @ts-ignore
            mergedSettings[settingsKey] = storedValue === 'true';
            break;
          case 'blockOnVisitCount':
            // @ts-ignore
            mergedSettings[settingsKey] = Number(storedValue);
            break;
          case 'style':
            mergedSettings.style = convertStyle(storedValue) || defaultSettings.style;
            break;
          case 'keyConflictResolution':
            mergedSettings.keyConflictResolution = safeJsonParse(storedValue, {});
            break;
          default:
            // @ts-ignore
            mergedSettings[settingsKey] = storedValue;
        }
        localStorage.removeItem(storageKey);
      }
    }

    if (hasMigrated) {
      localStorage.setItem('settings', JSON.stringify(mergedSettings));
    }

    return mergedSettings;

  } catch (error) {
    logService.init('Помилка завантаження налаштувань:', error);
    return defaultSettings;
  }
}

function createSettingsStore() {
  const { subscribe, set, update } = writable<any>(loadSettings());

  const methods = {
    init: () => {
      try {
        if (isBrowser) {
          const settings = loadSettings();
          set(settings);
          subscribe(currentSettings => {
            document.documentElement.setAttribute('data-theme', currentSettings.theme);
            document.documentElement.setAttribute('data-style', currentSettings.style);
          });
        }
        logService.init('settingsStore ініціалізовано успішно');
      } catch (error) {
        logService.init('Помилка ініціалізації settingsStore:', error);
        set(defaultSettings);
      }
    },
    updateSettings: (newSettings: Partial<any>) => {
      update((state: any) => {
          const merged = { ...state, ...newSettings };
          logService.state('Оновлення налаштувань. Поточний стан:', state);
          logService.state('Нові налаштування:', newSettings);
          logService.state('Об\'єднані налаштування:', merged);
          if (isBrowser) {
            const persistentState = { ...merged };
            
            if (merged.rememberGameMode) {
              persistentState.gameMode = merged.gameMode;
            } else {
              persistentState.gameMode = null;
            }
  
            if (isBrowser && merged.gameMode) {
              sessionStorage.setItem('gameMode', merged.gameMode);
            } else if (isBrowser) {
              sessionStorage.removeItem('gameMode');
            }
  
            logService.state('Стан для збереження в localStorage:', persistentState);
            localStorage.setItem('settings', JSON.stringify(persistentState));
          }
          return merged;
        });
    },
    setVisibilityLevel: (level: number) => {
      let newSettings: Partial<any> = {};
      switch (level) {
        case 1: newSettings = { showBoard: false, showPiece: false, showMoves: false }; break;
        case 2: newSettings = { showBoard: true, showPiece: false, showMoves: false }; break;
        case 3: newSettings = { showBoard: true, showPiece: true, showMoves: false }; break;
        case 4: newSettings = { showBoard: true, showPiece: true, showMoves: true }; break;
      }
      methods.updateSettings(newSettings);
    },
    resetSettings: () => {
      if (isBrowser) {
        localStorage.removeItem('settings');
      }
      set(defaultSettings);
    },
    resetKeybindings: () => {
      methods.updateSettings({ keybindings: defaultSettings.keybindings });
    },
    /**
     * @param {string} key
     * @param {KeybindingAction} action
     */
    /**
     * @param {string} key
     * @param {KeybindingAction} action
     */
    resolveKeyConflict: (key: string, action: KeybindingAction) => {
      update((state: any) => {
        const newResolution = { ...state.keyConflictResolution, [key]: action };
        if (isBrowser) {
          localStorage.setItem('keyConflictResolution', JSON.stringify(newResolution));
        }
        return { ...state, keyConflictResolution: newResolution };
      });
    },
    toggleShowBoard: (forceState: boolean | undefined) => {
      update((state: any) => {
        const newState = typeof forceState === 'boolean' ? forceState : !state.showBoard;
        const newSettings = { ...state, showBoard: newState };
        if (isBrowser) {
          localStorage.setItem('showBoard', String(newSettings.showBoard));
        }
        return newSettings;
      });
    },
    toggleShowMoves: () => {
      update(state => {
        const newState = !state.showMoves;
        if (isBrowser) localStorage.setItem('showMoves', String(newState));
        return { ...state, showMoves: newState };
      });
    },
    toggleShowPiece: () => {
      update(state => {
        const newShowPieceState = !state.showPiece;
        const newSettings = { ...state, showPiece: newShowPieceState };
        if (!newShowPieceState) {
          newSettings.showMoves = false;
        }
        if (isBrowser) {
          localStorage.setItem('showPiece', String(newSettings.showPiece));
          if (!newShowPieceState) {
            localStorage.setItem('showMoves', String(newSettings.showMoves));
          }
        }
        return newSettings;
      });
    },
    toggleAutoHideBoard: () => {
      update(state => {
        const newState = !state.autoHideBoard;
        if (isBrowser) localStorage.setItem('autoHideBoard', String(newState));
        return { ...state, autoHideBoard: newState };
      });
    },
    setGameInfoWidgetState: (newState: 'hidden' | 'shown' | 'compact') => {
      update((state: any) => {
        if (isBrowser) localStorage.setItem('showGameInfoWidget', newState);
        return { ...state, showGameInfoWidget: newState };
      });
    },
    toggleBlockMode: () => {
      update((state: any) => {
        const newState = !state.blockModeEnabled;
        if (isBrowser) localStorage.setItem('blockModeEnabled', String(newState));
        if (newState) {
          gameState.update(gs => {
            const resetHistoryEntry = {
              pos: { row: gs.playerRow, col: gs.playerCol },
              blocked: [] as {row: number, col: number}[],
              visits: {},
              blockModeEnabled: newState
            };
            return {
              ...gs,
              cellVisitCounts: {},
              movesInBlockMode: 0,
              moveHistory: [...gs.moveHistory, resetHistoryEntry]
            };
          });
        }
        return { ...state, blockModeEnabled: newState };
      });
    },
    toggleSpeech: async (desiredState?: boolean) => {
      const currentState = get(settingsStore);
      const isEnabled = typeof desiredState === 'boolean' ? desiredState : !currentState.speechEnabled;
      if (!isEnabled) {
        methods.updateSettings({ speechEnabled: false });
        return;
      }
      const allVoices = await loadAndGetVoices();
      const currentLocale = get(locale) || 'uk';
      const availableVoices = filterVoicesByLang(allVoices, currentLocale);
      const hasConfiguredSpeech = isBrowser && localStorage.getItem('hasConfiguredSpeech') === 'true';
      if (availableVoices.length > 0) {
        if (!hasConfiguredSpeech) {
          openVoiceSettingsModal();
          if (isBrowser) localStorage.setItem('hasConfiguredSpeech', 'true');
        }
        methods.updateSettings({ speechEnabled: true });
      } else {
        openVoiceSettingsModal();
        methods.updateSettings({ speechEnabled: false });
      }
    },
    /**
     * @param {'beginner' | 'experienced' | 'pro'} mode
     * @returns {boolean}
     */
    /**
     * @param {'beginner' | 'experienced' | 'pro'} mode
     * @param {any} [modal=modalStore]
     * @returns {boolean}
     */
    applyGameModePreset: (mode: 'beginner' | 'experienced' | 'pro', modal = modalStore) => {
      let settingsToApply: Partial<any> = {};
      let showFaq = false;
      switch (mode) {
        case 'beginner':
          settingsToApply = { showBoard: true, showPiece: true, showMoves: true, showGameInfoWidget: 'shown', blockModeEnabled: false, speechEnabled: false, autoHideBoard: false };
          showFaq = true;
          break;
        case 'experienced':
          settingsToApply = { showBoard: true, showPiece: true, showMoves: true, showGameInfoWidget: 'shown', blockModeEnabled: false, speechEnabled: true, autoHideBoard: true };
          break;
        case 'pro':
          settingsToApply = { showBoard: true, showPiece: true, showMoves: true, showGameInfoWidget: 'shown', blockModeEnabled: true, blockOnVisitCount: 0, speechEnabled: true, autoHideBoard: true };
          break;
      }
      settingsToApply.gameMode = mode;
      if (modal === modalStore) {
        settingsToApply.rememberGameMode = get(settingsStore).showGameModeModal ? false : true;
      } else {
        settingsToApply.rememberGameMode = true;
      }
      methods.updateSettings(settingsToApply);
      modal.closeModal();
      return showFaq;
    },
    toggleTestMode: () => {
      update(state => {
        const newState = !state.testMode;
        if (isBrowser) localStorage.setItem('testMode', String(newState));
        return { ...state, testMode: newState };
      });
    },
  };
  return { subscribe, ...methods };
}

export const settingsStore = createSettingsStore();