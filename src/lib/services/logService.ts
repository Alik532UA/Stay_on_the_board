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
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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
    [LOG_GROUPS.GAME_MODE]: true,
    [LOG_GROUPS.SPEECH]: false,
    [LOG_GROUPS.VOICE_CONTROL]: false,
    [LOG_GROUPS.STATE]: false,
    [LOG_GROUPS.PIECE]: false,
    [LOG_GROUPS.LOGIC_MOVE]: false,
    [LOG_GROUPS.TEST_MODE]: false,
    [LOG_GROUPS.MODAL]: true,
    [LOG_GROUPS.ERROR]: true,
    [LOG_GROUPS.HOTKEY]: false,
    [LOG_GROUPS.PRESENCE]: true,
};

const STORAGE_KEY = 'logConfig';

function loadConfig(): LogConfig {
    if (!isBrowser) return defaultConfig;
    try {
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
            return { ...defaultConfig, ...JSON.parse(savedConfig) };
        }
    } catch (e) {
        // Fallback for workers or private mode
    }
    return defaultConfig;
}

function saveConfig(config: LogConfig): void {
    if (isBrowser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
}

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

const styles: Record<string, string> = {};
Object.entries(LOG_COLORS).forEach(([group, color]) => {
    styles[group.toLowerCase()] = `color: ${color}; font-weight: bold;`;
});

// Custom style for ACTION
styles[LOG_GROUPS.ACTION] += ' background-color: #333; padding: 2px 4px; border-radius: 2px;';
styles[LOG_GROUPS.TEST_MODE] += ' background-color: #333; padding: 2px 4px; border-radius: 2px;';

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

/**
 * Основна функція логування з підтримкою групування та рівнів.
 */
function baseLog(group: LogGroup, level: LogLevel, message: string, ...data: unknown[]): void {
    if ((isDev || isForceEnabled) && logConfig[group]) {
        const style = styles[group] || '';
        const label = `[${group.toUpperCase()}]`;
        
        // Використовуємо console.groupCollapsed, якщо є додаткові дані
        if (data.length > 0) {
            console.groupCollapsed(`%c${label} %c${message}`, style, 'color: inherit; font-weight: normal;');
            console[level](...data);
            console.groupEnd();
        } else {
            console[level](`%c${label} %c${message}`, style, 'color: inherit; font-weight: normal;');
        }

        // Надсилаємо в debugLogStore тільки якщо ми в браузері (бо стор використовує Svelte)
        if (isBrowser) {
            const displayMessage = `[${group.toUpperCase()}] [${level.toUpperCase()}] ${message} ${formatDataForDisplay(data)}`;
            debugLogStore.add(displayMessage);
        }
    }
}

/**
 * Тип для динамічного логера.
 */
type LoggerMethods = {
    [K in LogGroup]: (message: string, ...data: unknown[]) => void;
} & {
    info: (message: string, ...data: unknown[]) => void;
    error: (message: string, ...data: unknown[]) => void;
    forceEnableLogging: () => void;
    setLogLevels: (newConfig: Partial<LogConfig>) => void;
};

/**
 * Створення Proxy для динамічної обробки методів.
 */
const loggerProxy = new Proxy({} as LoggerMethods, {
    get(target, prop: string) {
        // Статичні методи та властивості
        if (prop === 'forceEnableLogging') {
            return () => {
                if (!isForceEnabled) {
                    isForceEnabled = true;
                    console.log('%c[LOG_SERVICE]%c Production logging enabled.', 'font-weight: bold; color: #4CAF50;', 'color: inherit;');
                    if (isBrowser) debugLogStore.add('[INFO] Logging has been force-enabled for this session.');
                }
            };
        }

        if (prop === 'info' || prop === 'init') {
            return (msg: string, ...data: unknown[]) => baseLog(LOG_GROUPS.INIT, 'info', msg, ...data);
        }

        if (prop === 'error') {
            return (msg: string, ...data: unknown[]) => baseLog(LOG_GROUPS.ERROR, 'error', msg, ...data);
        }

        // Спеціальний мапінг для існуючих методів (CamelCase -> snake_case)
        const camelToSnake = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        let groupName = prop as LogGroup;

        // Перевірка на CamelCase (наприклад, logicVirtualPlayer -> logic_virtual_player)
        if (!(Object.values(LOG_GROUPS) as string[]).includes(prop)) {
            const snakeCandidate = camelToSnake(prop) as LogGroup;
            if ((Object.values(LOG_GROUPS) as string[]).includes(snakeCandidate)) {
                groupName = snakeCandidate;
            }
        }

        // Якщо група існує, повертаємо функцію логування
        if ((Object.values(LOG_GROUPS) as string[]).includes(groupName)) {
            const level: LogLevel = groupName === LOG_GROUPS.ERROR ? 'error' : 'info';
            return (msg: string, ...data: unknown[]) => baseLog(groupName, level, msg, ...data);
        }

        // Fallback для невідомих властивостей
        return undefined;
    }
});

export const logService = loggerProxy;

// Глобальний контролер для розробника (тільки в браузері)
if (isBrowser) {
    const globalWin = window as any;
    
    globalWin.setLogLevels = (newConfig: Partial<LogConfig>) => {
        logConfig = { ...logConfig, ...newConfig };
        saveConfig(logConfig);
        console.log('Log levels updated:', logConfig);
    };

    globalWin.getLogConfig = () => logConfig;

    globalWin.enableProdLogging = () => {
        localStorage.setItem('force-logging', 'true');
        logService.forceEnableLogging();
        console.log('Production logging enabled. Refresh the page for full effect.');
    };

    if (isDev || isForceEnabled) {
        console.log('%c[LOG_SERVICE]%c Developer tools initialized. Use window.setLogLevels({ groupName: boolean }) to configure.', 'font-weight: bold; color: #00BCD4;', 'color: inherit;');
    }
}
