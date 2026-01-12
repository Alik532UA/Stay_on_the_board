/**
 * @file Глобальна конфігурація додатку.
 * @description SSoT для назви платформи та базових налаштувань.
 */

export const APP_CONFIG = {
    // Змініть це значення, якщо потрібно перейменувати платформу
    NAME: "MindStep",

    // Версія конфігурації (для майбутніх міграцій)
    CONFIG_VERSION: 1,

    // Налаштування режимів
    MODES: {
        SURVIVE: 'survive', // Поточний режим "Stay on the Board"
        ARENA: 'arena',     // Майбутній режим
        MAZE: 'maze'        // Майбутній режим
    }
} as const;