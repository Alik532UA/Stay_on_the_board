/**
 * Типи та інтерфейси для проекту "Stay on the board"
 * @fileoverview Визначення типів для кращої типобезпеки та документації
 */

// ===== ОСНОВНІ ТИПИ =====

/**
 * @typedef {Object} AppState
 * @property {SettingsState} settings - Налаштування додатку
 * @property {GameState} game - Стан гри
 * @property {UIState} ui - UI стан
 */

/**
 * @typedef {Object} SettingsState
 * @property {'uk'|'en'|'nl'|'crh'} language - Мова інтерфейсу
 * @property {'light'|'dark'} theme - Тема інтерфейсу
 * @property {'classic'|'peak'|'cs2'|'glass'|'material'} style - Стиль гри
 * @property {boolean} speechEnabled - Чи увімкнено голосове управління
 * @property {boolean} showBoard - Чи показувати дошку
 * @property {boolean} showMoves - Чи показувати можливі ходи
 * @property {boolean} blockedMode - Чи увімкнено режим блокування
 */

/**
 * @typedef {Object} GameState
 * @property {boolean} isActive - Чи активна гра
 * @property {number[][]} board - Ігрове поле
 * @property {1|2} currentPlayer - Поточний гравець
 * @property {number} points - Очки
 * @property {string|null} selectedDirection - Обраний напрямок
 * @property {number|null} selectedDistance - Обрана відстань
 * @property {Array<{row: number, col: number}>} blockedCells - Заблоковані клітинки
 * @property {Array<{row: number, col: number}>} availableMoves - Доступні ходи
 * @property {boolean} showingAvailableMoves - Чи показуються доступні ходи
 * @property {'vsComputer'|'localTwoPlayer'|'online'|null} gameMode - Режим гри
 * @property {{p1: string, p2: string}} playerNames - Імена гравців
 * @property {number} boardSize - Розмір дошки
 * @property {any} selectedMove - Обраний хід
 * @property {boolean} moveConfirmed - Чи підтверджено хід
 * @property {boolean} noMoves - Чи немає доступних ходів
 * @property {Array<any>} gameHistory - Історія гри
 * @property {any} lastMove - Останній хід
 */

/**
 * @typedef {Object} UIState
 * @property {'mainMenu'|'game'|'settings'} currentView - Поточний екран
 * @property {ModalState} modal - Стан модального вікна
 * @property {{isVisible: boolean}} topControls - Верхні елементи управління
 * @property {boolean} loading - Чи відбувається завантаження
 * @property {string|null} error - Повідомлення про помилку
 */

/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen - Чи відкрите модальне вікно
 * @property {string} title - Заголовок
 * @property {string} content - Вміст
 * @property {Array<ModalButton>} buttons - Кнопки
 */

/**
 * @typedef {Object} ModalButton
 * @property {string} text - Текст кнопки
 * @property {string} action - Дія кнопки
 * @property {boolean} [primary] - Чи це основна кнопка
 */

// ===== КОМПОНЕНТИ =====

/**
 * @typedef {Object} ComponentOptions
 * @property {string} [id] - Унікальний ідентифікатор
 * @property {string} [className] - CSS клас
 * @property {Object} [attributes] - HTML атрибути
 * @property {Object} [styles] - CSS стилі
 * @property {boolean} [visible] - Чи видимий компонент
 * @property {boolean} [enabled] - Чи активний компонент
 */

/**
 * @typedef {Object} BaseComponent
 * @property {HTMLElement} element - DOM елемент компонента
 * @property {ComponentOptions} options - Опції компонента
 * @property {Array<Function>} subscriptions - Підписки на зміни
 * @property {Map<string, {element: HTMLElement, event: string, handler: Function}>} eventListeners - Обробники подій
 * @property {boolean} isDestroyed - Чи знищений компонент
 * @property {number} renderCount - Кількість рендерів
 */

// ===== ПОДІЇ =====

/**
 * @typedef {Object} GameEvent
 * @property {string} type - Тип події
 * @property {any} data - Дані події
 * @property {number} timestamp - Час події
 * @property {string} id - Унікальний ідентифікатор
 */

/**
 * @typedef {Object} EventHandler
 * @property {Function} handler - Обробник події
 * @property {Object} options - Опції обробника
 */

// ===== ВАЛІДАЦІЯ =====

/**
 * @typedef {Object} ValidationRule
 * @property {Function} test - Функція перевірки
 * @property {string} message - Повідомлення про помилку
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Чи валідний результат
 * @property {Array<string>} errors - Список помилок
 */

// ===== КЕШ =====

/**
 * @typedef {Object} CacheEntry
 * @property {Element|NodeList} element - DOM елемент
 * @property {NodeList|null} elements - Список DOM елементів
 * @property {number} timestamp - Час створення
 * @property {number} hits - Кількість звернень
 */

/**
 * @typedef {Object} CacheStats
 * @property {number} size - Розмір кешу
 * @property {number} maxSize - Максимальний розмір
 * @property {number} hits - Кількість попадань
 * @property {number} misses - Кількість промахів
 * @property {number} hitRate - Відсоток попадань
 * @property {number} ttl - Час життя
 * @property {Array<{key: string, hits: number, age: number}>} popularElements - Популярні елементи
 */

// ===== ЛОГУВАННЯ =====

/**
 * @typedef {Object} LogEntry
 * @property {string} level - Рівень логування
 * @property {string} message - Повідомлення
 * @property {Object} data - Додаткові дані
 * @property {string} context - Контекст
 * @property {string} timestamp - Час логування
 * @property {string} id - Унікальний ідентифікатор
 * @property {string} stack - Стек викликів
 */

/**
 * @typedef {Object} LogStats
 * @property {number} total - Загальна кількість
 * @property {Object} byLevel - Кількість по рівнях
 * @property {Object} byContext - Кількість по контекстах
 * @property {Array<LogEntry>} recent - Останні логи
 */

// ===== ТЕСТУВАННЯ =====

/**
 * @typedef {Object} TestResult
 * @property {string} name - Назва тесту
 * @property {'passed'|'failed'|'pending'} status - Статус тесту
 * @property {number} duration - Час виконання
 * @property {Object|null} error - Помилка
 * @property {number} startTime - Час початку
 */

/**
 * @typedef {Object} TestSummary
 * @property {number} total - Загальна кількість тестів
 * @property {number} passed - Кількість успішних
 * @property {number} failed - Кількість невдалих
 * @property {number} duration - Загальний час
 * @property {number} successRate - Відсоток успішності
 * @property {Array<TestResult>} results - Результати тестів
 */

// ===== УТИЛІТИ =====

/**
 * @typedef {Object} AnimationOptions
 * @property {number} duration - Тривалість анімації
 * @property {string} easing - Функція плавності
 * @property {Function} onComplete - Колбек завершення
 * @property {Function} onStart - Колбек початку
 */

/**
 * @typedef {Object} FormData
 * @property {Object} values - Значення полів
 * @property {Object} errors - Помилки валідації
 * @property {boolean} isValid - Чи форма валідна
 */

// ===== КОНСТАНТИ =====

/**
 * @enum {string}
 */
const GameModes = {
    VS_COMPUTER: 'vsComputer',
    LOCAL_TWO_PLAYER: 'localTwoPlayer',
    ONLINE: 'online'
};

/**
 * @enum {string}
 */
const Views = {
    MAIN_MENU: 'mainMenu',
    GAME: 'game',
    SETTINGS: 'settings'
};

/**
 * @enum {string}
 */
const Languages = {
    UKRAINIAN: 'uk',
    ENGLISH: 'en',
    CRIMEAN_TATAR: 'crh',
    DUTCH: 'nl'
};

/**
 * @enum {string}
 */
const Themes = {
    LIGHT: 'light',
    DARK: 'dark'
};

/**
 * @enum {string}
 */
const Styles = {
    CLASSIC: 'classic',
    PEAK: 'peak',
    CS2: 'cs2',
    GLASS: 'glass',
    MATERIAL: 'material'
};

/**
 * @enum {string}
 */
const LogLevels = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Експорт типів
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameModes,
        Views,
        Languages,
        Themes,
        Styles,
        LogLevels
    };
} else {
    window.Types = {
        GameModes,
        Views,
        Languages,
        Themes,
        Styles,
        LogLevels
    };
} 