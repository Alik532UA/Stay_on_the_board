// file: src/lib/services/logService.ts
/**
 * @file Централізований сервіс логування з групами та стилями.
 * @description Логування працює в режимі розробки або якщо увімкнено примусово.
 * Використовує localStorage для збереження конфігурації.
 */

import { debugLogStore } from '../stores/debugLogStore';

const isBrowser = typeof window !== 'undefined';
const isDev = import.meta.env.DEV;
let isForceEnabled = false;

// Check localStorage to force logs on production
if (isBrowser && localStorage.getItem('force-logging') === 'true') {
    isForceEnabled = true;
}

/**
 * Групи логування.
 */
export const LOG_GROUPS = {
    STATE: 'state',
    PIECE: 'piece',
    LOGIC_GENERAL: 'logic_general',
    LOGIC_BOARD: 'logic_board',
    LOGIC_WIN: 'logic_win',
    LOGIC_MOVE: 'logic_move',
    LOGIC_VIRTUAL_PLAYER: 'logic_virtual_player',
    LOGIC_AVAILABILITY: 'logic_availability',
    LOGIC_TIME: 'logic_time',
    SCORE: 'score',
    UI: 'ui',
    TOOLTIP: 'tooltip',
    ANIMATION: 'animation',
    INIT: 'init',
    ACTION: 'action',
    GAME_MODE: 'game_mode',
    SPEECH: 'speech',
    VOICE_CONTROL: 'voice_control',
    TEST_MODE: 'test_mode',
    MODAL: 'modal',
    ERROR: 'error',
    HOTKEY: 'hotkey',
    PRESENCE: 'presence'
} as const;

export type LogGroup = typeof LOG_GROUPS[keyof typeof LOG_GROUPS];

/**
 * Тип конфігурації логування.
 */
export type LogConfig = Record<LogGroup, boolean>;

const defaultConfig: LogConfig = {
    [LOG_GROUPS.LOGIC_GENERAL]: false,
    [LOG_GROUPS.LOGIC_BOARD]: false,
    [LOG_GROUPS.LOGIC_WIN]: false,
    [LOG_GROUPS.LOGIC_VIRTUAL_PLAYER]: false,
    [LOG_GROUPS.LOGIC_AVAILABILITY]: false,
    [LOG_GROUPS.LOGIC_TIME]: false,
    [LOG_GROUPS.SCORE]: false,
    [LOG_GROUPS.UI]: false,
    [LOG_GROUPS.TOOLTIP]: false,
    [LOG_GROUPS.ANIMATION]: false,
    [LOG_GROUPS.INIT]: false,
    [LOG_GROUPS.ACTION]: false,
    [LOG_GROUPS.GAME_MODE]: true, // Focus
    [LOG_GROUPS.SPEECH]: false,
    [LOG_GROUPS.VOICE_CONTROL]: false,
    [LOG_GROUPS.STATE]: false,
    [LOG_GROUPS.PIECE]: false,
    [LOG_GROUPS.LOGIC_MOVE]: false,
    [LOG_GROUPS.TEST_MODE]: false,
    [LOG_GROUPS.MODAL]: true, // Focus
    [LOG_GROUPS.ERROR]: true, // Always on
    [LOG_GROUPS.HOTKEY]: false,
    [LOG_GROUPS.PRESENCE]: true, // Focus
};


const STORAGE_KEY = 'logConfig';

function formatDataForDisplay(data: unknown[]): string {
    return data.map(item => {
        if (typeof item === 'object' && item !== null) {
            try {
                return JSON.stringify(item);
            } catch {
                return '[Unserializable Object]';
            }
        }
        return String(item);
    }).join(' ');
}

function loadConfig(): LogConfig {
    if (!isBrowser) return defaultConfig;
    try {
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
            return { ...defaultConfig, ...JSON.parse(savedConfig) };
        }
    } catch (e) {
        console.error('Failed to load log config from localStorage', e);
    }
    return defaultConfig;
}

function saveConfig(config: LogConfig): void {
    if (isBrowser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
}

/**
 * Кольори для груп логування.
 */
const LOG_COLORS = {
    STATE: '#9C27B0',
    PIECE: '#795548',
    LOGIC_GENERAL: '#607D8B',
    LOGIC_BOARD: '#795548',
    LOGIC_WIN: '#FFC107',
    LOGIC_MOVE: '#03A9F4',
    LOGIC_VIRTUAL_PLAYER: '#2962FF',
    LOGIC_AVAILABILITY: '#64B5F6',
    LOGIC_TIME: '#FFC107',
    SCORE: '#4CAF50',
    UI: '#FF9800',
    TOOLTIP: '#6c757d',
    ANIMATION: '#E91E63',
    INIT: '#00BCD4',
    GAME_MODE: '#FF5722',
    ACTION: '#FFEB3B',
    SPEECH: '#8E44AD',
    VOICE_CONTROL: '#00E676',
    TEST_MODE: '#FBC02D',
    MODAL: '#673AB7',
    ERROR: '#F44336',
    HOTKEY: '#607D8B',
    PRESENCE: '#9b59b6',
} as const;

let logConfig = loadConfig();

const styles: Record<LogGroup, string> = {
    [LOG_GROUPS.STATE]: `color: ${LOG_COLORS.STATE}; font-weight: bold;`,
    [LOG_GROUPS.PIECE]: `color: ${LOG_COLORS.PIECE}; font-weight: bold;`,
    [LOG_GROUPS.LOGIC_GENERAL]: `color: ${LOG_COLORS.LOGIC_GENERAL};`,
    [LOG_GROUPS.LOGIC_BOARD]: `color: ${LOG_COLORS.LOGIC_BOARD};`,
    [LOG_GROUPS.LOGIC_WIN]: `color: ${LOG_COLORS.LOGIC_WIN}; font-weight: bold;`,
    [LOG_GROUPS.LOGIC_MOVE]: `color: ${LOG_COLORS.LOGIC_MOVE}; font-weight: bold;`,
    [LOG_GROUPS.LOGIC_VIRTUAL_PLAYER]: `color: ${LOG_COLORS.LOGIC_VIRTUAL_PLAYER}; font-weight: bold;`,
    [LOG_GROUPS.LOGIC_AVAILABILITY]: `color: ${LOG_COLORS.LOGIC_AVAILABILITY}; font-weight: bold;`,
    [LOG_GROUPS.LOGIC_TIME]: `color: ${LOG_COLORS.LOGIC_TIME}; font-weight: bold;`,
    [LOG_GROUPS.SCORE]: `color: ${LOG_COLORS.SCORE}; font-weight: bold;`,
    [LOG_GROUPS.UI]: `color: ${LOG_COLORS.UI}; font-weight: bold;`,
    [LOG_GROUPS.TOOLTIP]: `color: ${LOG_COLORS.TOOLTIP}; font-weight: bold;`,
    [LOG_GROUPS.ANIMATION]: `color: ${LOG_COLORS.ANIMATION}; font-weight: bold;`,
    [LOG_GROUPS.INIT]: `color: ${LOG_COLORS.INIT}; font-weight: bold;`,
    [LOG_GROUPS.GAME_MODE]: `color: ${LOG_COLORS.GAME_MODE}; font-weight: bold;`,
    [LOG_GROUPS.ACTION]: `color: ${LOG_COLORS.ACTION}; font-weight: bold; background-color: #333; padding: 2px 4px; border-radius: 2px;`,
    [LOG_GROUPS.SPEECH]: `color: ${LOG_COLORS.SPEECH}; font-weight: bold;`,
    [LOG_GROUPS.VOICE_CONTROL]: `color: ${LOG_COLORS.VOICE_CONTROL}; font-weight: bold;`,
    [LOG_GROUPS.TEST_MODE]: `color: ${LOG_COLORS.TEST_MODE}; font-weight: bold; background-color: #333; padding: 2px 4px; border-radius: 2px;`,
    [LOG_GROUPS.MODAL]: `color: ${LOG_COLORS.MODAL}; font-weight: bold;`,
    [LOG_GROUPS.ERROR]: `color: ${LOG_COLORS.ERROR}; font-weight: bold;`,
    [LOG_GROUPS.HOTKEY]: `color: ${LOG_COLORS.HOTKEY}; font-style: italic;`,
    [LOG_GROUPS.PRESENCE]: `color: ${LOG_COLORS.PRESENCE}; font-weight: bold;`,
};

function log(group: LogGroup, message: string, ...data: unknown[]): void {
    if ((isDev || isForceEnabled) && logConfig[group]) {
        const style = styles[group] || '';
        if (data.length > 0) {
            console.log(`%c[${group.toUpperCase()}]%c ${message}`, style, 'color: inherit;', ...data);
        } else {
            console.log(`%c[${group.toUpperCase()}]%c ${message}`, style, 'color: inherit;');
        }
        const displayMessage = `[${group.toUpperCase()}] ${message} ${formatDataForDisplay(data)}`;
        debugLogStore.add(displayMessage);
    }
}

/**
 * Публічний сервіс логування.
 */
export const logService = {
    state: (message: string, ...data: unknown[]) => log(LOG_GROUPS.STATE, message, ...data),
    piece: (message: string, ...data: unknown[]) => log(LOG_GROUPS.PIECE, message, ...data),
    logicMove: (message: string, ...data: unknown[]) => log(LOG_GROUPS.LOGIC_MOVE, message, ...data),
    logicVirtualPlayer: (message: string, ...data: unknown[]) => log(LOG_GROUPS.LOGIC_VIRTUAL_PLAYER, message, ...data),
    logicAvailability: (message: string, ...data: unknown[]) => log(LOG_GROUPS.LOGIC_AVAILABILITY, message, ...data),
    logicTime: (message: string, ...data: unknown[]) => log(LOG_GROUPS.LOGIC_TIME, message, ...data),
    score: (message: string, ...data: unknown[]) => log(LOG_GROUPS.SCORE, message, ...data),
    ui: (message: string, ...data: unknown[]) => log(LOG_GROUPS.UI, message, ...data),
    tooltip: (message: string, ...data: unknown[]) => log(LOG_GROUPS.TOOLTIP, message, ...data),
    animation: (message: string, ...data: unknown[]) => log(LOG_GROUPS.ANIMATION, message, ...data),
    init: (message: string, ...data: unknown[]) => log(LOG_GROUPS.INIT, message, ...data),
    action: (message: string, ...data: unknown[]) => log(LOG_GROUPS.ACTION, message, ...data),
    GAME_MODE: (message: string, ...data: unknown[]) => log(LOG_GROUPS.GAME_MODE, message, ...data),
    speech: (message: string, ...data: unknown[]) => log(LOG_GROUPS.SPEECH, message, ...data),
    voiceControl: (message: string, ...data: unknown[]) => log(LOG_GROUPS.VOICE_CONTROL, message, ...data),
    testMode: (message: string, ...data: unknown[]) => log(LOG_GROUPS.TEST_MODE, message, ...data),
    modal: (message: string, ...data: unknown[]) => log(LOG_GROUPS.MODAL, message, ...data),
    error: (message: string, ...data: unknown[]) => log(LOG_GROUPS.ERROR, message, ...data),
    hotkey: (message: string, ...data: unknown[]) => log(LOG_GROUPS.HOTKEY, message, ...data),
    presence: (message: string, ...data: unknown[]) => log(LOG_GROUPS.PRESENCE, message, ...data),
    info: (message: string, ...data: unknown[]) => log(LOG_GROUPS.INIT, message, ...data),
    forceEnableLogging: (): void => {
        if (!isForceEnabled) {
            isForceEnabled = true;
            console.log('Logging has been force-enabled for this session.');
            debugLogStore.add('[INFO] Logging has been force-enabled for this session.');
        }
    }
};

// Глобальний контролер для розробника
function initializeDeveloperTools(): void {
    if (!isBrowser) return;

    (window as unknown as Record<string, unknown>).setLogLevels = (newConfig: Partial<LogConfig>) => {
        logConfig = { ...logConfig, ...newConfig };
        saveConfig(logConfig);
        console.log('Log levels updated:', logConfig);
    };

    (window as unknown as Record<string, unknown>).getLogConfig = () => {
        return logConfig;
    };

    console.log('Log service developer tools initialized. Use window.setLogLevels({ groupName: boolean }) to configure.');
}

if (isDev || isForceEnabled) {
    initializeDeveloperTools();
}

if (isBrowser) {
    (window as unknown as Record<string, unknown>).enableProdLogging = () => {
        if (isForceEnabled) {
            console.log('Logging is already enabled.');
            return;
        }
        localStorage.setItem('force-logging', 'true');
        isForceEnabled = true;
        initializeDeveloperTools();
        console.log('Production logging enabled. Refresh the page for full effect. Use setLogLevels({ ... }) to configure.');
        debugLogStore.add('[INFO] Production logging enabled.');
    };
}
