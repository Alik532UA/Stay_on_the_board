
/**
 * Централізоване сховище для всіх часових констант гри.
 * Дозволяє уникнути магічних чисел та легко налаштовувати таймінги.
 */

// Тривалість ходу в секундах
export const TEMPO_TURN_DURATION = 15;
export const BASE_TURN_DURATION = 10;

// Множник часу для режиму розробки
export const DEV_TIME_MULTIPLIER = 3;

// Затримки
export const COMPUTER_TURN_DELAY = 1000; // ms
export const MOVE_ANIMATION_DELAY = 300; // ms (typical animation duration)

// Тривалість ігор
export const TIMED_GAME_DURATION = 60000; // 1 хвилина в ms
