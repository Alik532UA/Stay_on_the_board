    const isBrowser = typeof window !== 'undefined';
    const isDev = import.meta.env.DEV;
    
    // 1. Визначення груп логування
    const LOG_GROUPS = {
      STATE: 'state',       // Для StateManager та змін стану
      LOGIC: 'logic',       // Для gameLogicService, gameOrchestrator
      SCORE: 'score',       // Для всього, що пов'язано з нарахуванням балів
      UI: 'ui',             // Для Svelte компонентів та їх життєвого циклу
      TOOLTIP: 'tooltip',   // Для логів тултіпів
      ANIMATION: 'animation', // Для animationStore та візуальних ефектів
      INIT: 'init',         // Для ініціалізації сторів та сервісів
      ACTION: 'action',     // Для дій користувача (кліки, хоткеї)
      GAME_MODE: 'game_mode', // Для логіки ігрових режимів
      SPEECH: 'speech',      // Для логів, пов'язаних з озвученням
      TEST_MODE: 'test_mode' // Для логів, пов'язаних з тестовим режимом
    };
    
    // 2. Конфігурація
    const defaultConfig = {
          [LOG_GROUPS.STATE]: false,
          [LOG_GROUPS.LOGIC]: true,
          [LOG_GROUPS.SCORE]: false,
          [LOG_GROUPS.UI]: false,
          [LOG_GROUPS.TOOLTIP]: false,
          [LOG_GROUPS.ANIMATION]: false,
          [LOG_GROUPS.INIT]: false,
          [LOG_GROUPS.ACTION]: true,
          [LOG_GROUPS.GAME_MODE]: true,
          [LOG_GROUPS.SPEECH]: false,
          [LOG_GROUPS.TEST_MODE]: false,
        };
    
    const STORAGE_KEY = 'logConfig';
    
    /**
     * Завантажує конфігурацію з localStorage або повертає стандартну.
     * @returns {typeof defaultConfig}
     */
    function loadConfig() {
      if (!isBrowser) return defaultConfig;
      try {
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
          // Поєднуємо збережену конфігурацію з дефолтною, щоб додати нові групи, якщо їх немає
          return { ...defaultConfig, ...JSON.parse(savedConfig) };
        }
      } catch (e) {
        console.error('Failed to load log config from localStorage', e);
      }
      return defaultConfig;
    }
    
    /**
     * Зберігає конфігурацію в localStorage.
     * @param {typeof defaultConfig} config
     */
    function saveConfig(config) {
      if (isBrowser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      }
    }
    
    // 3. Ініціалізація конфігурації
    let logConfig = loadConfig();
    
    // Стилі для консолі
    const styles = {
      [LOG_GROUPS.STATE]: 'color: #9C27B0; font-weight: bold;', // Purple
      [LOG_GROUPS.LOGIC]: 'color: #03A9F4; font-weight: bold;', // Blue
      [LOG_GROUPS.SCORE]: 'color: #4CAF50; font-weight: bold;', // Green
      [LOG_GROUPS.UI]: 'color: #FF9800; font-weight: bold;',    // Orange
      [LOG_GROUPS.TOOLTIP]: 'color: #6c757d; font-weight: bold;', // Gray
      [LOG_GROUPS.ANIMATION]: 'color: #E91E63; font-weight: bold;', // Pink
      [LOG_GROUPS.INIT]: 'color: #00BCD4; font-weight: bold;',     // Cyan
      [LOG_GROUPS.GAME_MODE]: 'color: #FF5722; font-weight: bold;', // Deep Orange
      [LOG_GROUPS.ACTION]: 'color: #FFEB3B; font-weight: bold; background-color: #333; padding: 2px 4px; border-radius: 2px;', // Yellow on dark
      [LOG_GROUPS.SPEECH]: 'color: #8E44AD; font-weight: bold;', // Purple
      [LOG_GROUPS.TEST_MODE]: 'color: #FBC02D; font-weight: bold; background-color: #333; padding: 2px 4px; border-radius: 2px;', // Yellow on dark
    };
    
    /**
     * Основна функція логування, яка перевіряє конфігурацію.
     * @param {string} group
     * @param {string} message
     * @param {any[]} data
     */
    function log(group, message, ...data) {
      if (isDev && logConfig[group]) {
        const style = styles[group] || '';
        if (data.length > 0) {
          console.log(`%c[${group.toUpperCase()}]%c ${message}`, style, 'color: inherit;', ...data);
        } else {
          console.log(`%c[${group.toUpperCase()}]%c ${message}`, style, 'color: inherit;');
        }
      }
    }
    
    // 4. Публічний сервіс з методами для кожної групи
    export const logService = {
      state: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.STATE, message, ...data),
      logic: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.LOGIC, message, ...data),
      score: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.SCORE, message, ...data),
      ui: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.UI, message, ...data),
      tooltip: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.TOOLTIP, message, ...data),
      animation: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.ANIMATION, message, ...data),
      init: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.INIT, message, ...data),
      action: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.ACTION, message, ...data),
      GAME_MODE: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.GAME_MODE, message, ...data),
      speech: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.SPEECH, message, ...data),
      testMode: (/** @type {string} */ message, /** @type {any[]} */ ...data) => log(LOG_GROUPS.TEST_MODE, message, ...data),
    };
    
    // 5. Глобальний контролер для зручності розробника-людини
    if (isBrowser && isDev) {
      (/** @type {any} */ (window)).setLogLevels = (/** @type {Record<string, boolean>} */ newConfig) => {
        logConfig = { ...logConfig, ...newConfig };
        saveConfig(logConfig);
        console.log('Log levels updated:', logConfig);
      };
      console.log('Log service initialized. Use window.setLogLevels({ groupName: boolean }) to configure.');
    }