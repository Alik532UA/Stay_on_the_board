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
    ERROR: 'error'
} as const;

export type LogGroup = typeof LOG_GROUPS[keyof typeof LOG_GROUPS];

/**
 * Тип конфігурації логування.
 */
export type LogConfig = Record<LogGroup, boolean>;

const defaultConfig: LogConfig = {
    [LOG_GROUPS.STATE]: false,
    [LOG_GROUPS.PIECE]: false,
    [LOG_GROUPS.LOGIC_MOVE]: false,
    [LOG_GROUPS.LOGIC_VIRTUAL_PLAYER]: false,
    [LOG_GROUPS.LOGIC_AVAILABILITY]: false,
    [LOG_GROUPS.LOGIC_TIME]: false,
    [LOG_GROUPS.SCORE]: true, // УВІМКНЕНО: Для перевірки нарахування балів та нагород
    [LOG_GROUPS.UI]: false, // ВИМКНЕНО: Зменшуємо шум
    [LOG_GROUPS.TOOLTIP]: false,
    [LOG_GROUPS.ANIMATION]: false, // ВИМКНЕНО: Зменшуємо шум
    [LOG_GROUPS.INIT]: false,
    [LOG_GROUPS.ACTION]: false,
    [LOG_GROUPS.GAME_MODE]: true, // УВІМКНЕНО: Для відстеження потоку гри
    [LOG_GROUPS.SPEECH]: false,
    [LOG_GROUPS.VOICE_CONTROL]: false,
    [LOG_GROUPS.TEST_MODE]: false,
    [LOG_GROUPS.MODAL]: false,
    [LOG_GROUPS.ERROR]: true,
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

let logConfig = loadConfig();

const styles: Record<LogGroup, string> = {
    [LOG_GROUPS.STATE]: 'color: #9C27B0; font-weight: bold;',
    [LOG_GROUPS.PIECE]: 'color: #795548; font-weight: bold;',
    [LOG_GROUPS.LOGIC_MOVE]: 'color: #03A9F4; font-weight: bold;',
    [LOG_GROUPS.LOGIC_VIRTUAL_PLAYER]: 'color: #2962FF; font-weight: bold;',
    [LOG_GROUPS.LOGIC_AVAILABILITY]: 'color: #64B5F6; font-weight: bold;',
    [LOG_GROUPS.LOGIC_TIME]: 'color: #FFC107; font-weight: bold;',
    [LOG_GROUPS.SCORE]: 'color: #4CAF50; font-weight: bold;',
    [LOG_GROUPS.UI]: 'color: #FF9800; font-weight: bold;',
    [LOG_GROUPS.TOOLTIP]: 'color: #6c757d; font-weight: bold;',
    [LOG_GROUPS.ANIMATION]: 'color: #E91E63; font-weight: bold;',
    [LOG_GROUPS.INIT]: 'color: #00BCD4; font-weight: bold;',
    [LOG_GROUPS.GAME_MODE]: 'color: #FF5722; font-weight: bold;',
    [LOG_GROUPS.ACTION]: 'color: #FFEB3B; font-weight: bold; background-color: #333; padding: 2px 4px; border-radius: 2px;',
    [LOG_GROUPS.SPEECH]: 'color: #8E44AD; font-weight: bold;',
    [LOG_GROUPS.VOICE_CONTROL]: 'color: #00E676; font-weight: bold;',
    [LOG_GROUPS.TEST_MODE]: 'color: #FBC02D; font-weight: bold; background-color: #333; padding: 2px 4px; border-radius: 2px;',
    [LOG_GROUPS.MODAL]: 'color: #673AB7; font-weight: bold;',
    [LOG_GROUPS.ERROR]: 'color: #F44336; font-weight: bold;',
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
        console.log('Production logging enabled. Refresh the page for full effect. Use setLogLevels({...}) to configure.');
        debugLogStore.add('[INFO] Production logging enabled.');
    };
}