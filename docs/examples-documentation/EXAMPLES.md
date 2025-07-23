# Тип: Довідка
# Статус: Актуально
# Назва: Приклади реалізації покращень архітектури
# Мета: Надати практичні приклади реалізації ключових покращень архітектури для Stay on the Board.
# Опис: Документ містить реальні приклади коду, патернів, JSDoc, типізації, структур даних, підписки, undo/redo, UI/UX та інших рішень, що використовуються у Stay on the Board.

## 🎯 Мета
Надати практичні приклади реалізації ключових покращень архітектури для проекту "Stay on the board".

## 1. Типізація та документація

### JSDoc для State Manager

```javascript
/**
 * Централізований менеджер стану додатку
 * @class StateManager
 * @example
 * const stateManager = new StateManager();
 * stateManager.setState('game.points', 10);
 * const points = stateManager.getState('game.points'); // 10
 */
class StateManager {
    /**
     * Створює новий екземпляр StateManager
     * @constructor
     */
    constructor() {
        /** @type {AppState} Поточний стан додатку */
        this.state = {
            settings: {
                language: 'uk',
                theme: 'dark',
                style: 'classic',
                speechEnabled: false,
                showBoard: true,
                showMoves: true, // За замовчуванням true
                blockedMode: false
            },
            game: {
                isActive: false,
                board: [],
                currentPlayer: 1,
                points: 0,
                selectedDirection: null,
                selectedDistance: null,
                blockedCells: [],
                availableMoves: [],
                showingAvailableMoves: false,
                gameMode: null,
                playerNames: { p1: '', p2: '' },
                boardSize: 5,
                selectedMove: null,
                moveConfirmed: false,
                noMoves: false,
                gameHistory: [],
                lastMove: null
            },
            ui: {
                currentView: 'mainMenu',
                modal: {
                    isOpen: false,
                    title: '',
                    content: '',
                    buttons: []
                },
                topControls: {
                    isVisible: true
                },
                loading: false,
                error: null
            }
        };
        
        /** @type {Map<string, Map<number, Function>>} Підписники на зміни стану */
        this.subscribers = new Map();
        
        /** @type {number} Унікальний ID для підписників */
        this.subscriberId = 0;
        
        /** @type {Array<HistoryRecord>} Історія змін для undo/redo */
        this.history = [];
        
        /** @type {number} Індекс поточної позиції в історії */
        this.historyIndex = -1;
        
        /** @type {number} Максимальний розмір історії */
        this.maxHistorySize = 50;
    }
    
    /**
     * Отримує значення зі стану за шляхом
     * @param {string} [path] - Шлях до властивості (наприклад, 'game.points')
     * @returns {*} Значення зі стану
     * @example
     * // Отримати весь стан
     * const state = stateManager.getState();
     * 
     * // Отримати конкретну властивість
     * const points = stateManager.getState('game.points');
     * 
     * // Отримати вкладену властивість
     * const p1Name = stateManager.getState('game.playerNames.p1');
     */
    getState(path = null) {
        if (!path) return this.state;
        
        return path.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : undefined;
        }, this.state);
    }
    
    /**
     * Встановлює значення в стані
     * @param {string} path - Шлях до властивості
     * @param {*} value - Нове значення
     * @returns {boolean} Чи успішно оновлено
     * @throws {Error} Якщо шлях недійсний
     * @example
     * // Встановити просту властивість
     * stateManager.setState('game.points', 10);
     * 
     * // Встановити вкладену властивість
     * stateManager.setState('game.playerNames.p1', 'Гравець 1');
     * 
     * // Встановити масив
     * stateManager.setState('game.board', [[0, 1, 0], [1, 0, 1]]);
     */
    setState(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);
        
        const oldValue = target[lastKey];
        
        // Валідація значень
        if (!this.validateValue(path, value)) {
            console.warn(`Invalid value for ${path}:`, value);
            return false;
        }
        
        target[lastKey] = value;
        
        // Зберігаємо в історію для undo/redo
        this.saveToHistory(path, oldValue, value);
        
        // Сповіщаємо підписників
        this.notifySubscribers(path, value, oldValue);
        
        // Зберігаємо в localStorage якщо це налаштування
        if (path.startsWith('settings.')) {
            const settingKey = path.replace('settings.', '');
            localStorage.setItem(settingKey, JSON.stringify(value));
        }
        
        return true;
    }
    
    /**
     * Підписується на зміни стану
     * @param {string} path - Шлях до властивості
     * @param {Function} callback - Функція зворотного виклику
     * @returns {Function} Функція для відписки
     * @example
     * // Підписка на зміни очок
     * const unsubscribe = stateManager.subscribe('game.points', (newValue, oldValue) => {
     *     console.log(`Очки змінилися з ${oldValue} на ${newValue}`);
     *     updateScoreDisplay(newValue);
     * });
     * 
     * // Відписка
     * unsubscribe();
     * 
     * // Підписка на всі зміни в грі
     * stateManager.subscribe('game', (gameState) => {
     *     updateGameUI(gameState);
     * });
     */
    subscribe(path, callback) {
        const id = ++this.subscriberId;
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Map());
        }
        this.subscribers.get(path).set(id, callback);
        
        // Повертаємо функцію для відписки
        return () => {
            const pathSubscribers = this.subscribers.get(path);
            if (pathSubscribers) {
                pathSubscribers.delete(id);
                if (pathSubscribers.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }
    
    /**
     * Валідує значення перед встановленням
     * @param {string} path - Шлях до властивості
     * @param {*} value - Значення для валідації
     * @returns {boolean} Чи валідне значення
     * @private
     */
    validateValue(path, value) {
        // Валідація для конкретних полів
        if (path === 'game.currentPlayer' && (value < 1 || value > 2)) {
            return false;
        }
        
        if (path === 'game.boardSize' && (value < 3 || value > 10)) {
            return false;
        }
        
        if (path === 'settings.language' && !['uk', 'en', 'crh', 'nl'].includes(value)) {
            return false;
        }
        
        if (path === 'settings.theme' && !['light', 'dark'].includes(value)) {
            return false;
        }
        
        if (path === 'settings.style' && !['classic', 'peak', 'cs2', 'glass', 'material'].includes(value)) {
            return false;
        }
        
        return true;
    }
}

/**
 * @typedef {Object} HistoryRecord
 * @property {string} path - Шлях до властивості
 * @property {*} oldValue - Старе значення
 * @property {*} newValue - Нове значення
 * @property {number} timestamp - Час зміни
 */

/**
 * @typedef {Object} AppState
 * @property {SettingsState} settings - Налаштування додатку
 * @property {GameState} game - Стан гри
 * @property {UIState} ui - Стан інтерфейсу
 */
```

## 2. Система подій (Event System)

### Event Bus з middleware

```javascript
/**
 * Централізована система подій з middleware
 * @class EventBus
 * @example
 * const eventBus = new EventBus();
 * 
 * // Додаємо middleware для логування
 * eventBus.use((eventData) => {
 *     console.log(`Event: ${eventData.type}`, eventData.data);
 *     return eventData;
 * });
 * 
 * // Підписуємося на події
 * eventBus.on('game.move', (data) => {
 *     console.log('Хід гравця:', data);
 * });
 * 
 * // Емітуємо подію
 * eventBus.emit('game.move', { player: 1, direction: 'up', distance: 2 });
 */
class EventBus {
    constructor() {
        /** @type {Map<string, Array<Function>>} Слухачі подій */
        this.listeners = new Map();
        
        /** @type {Array<Function>} Middleware функції */
        this.middleware = [];
        
        /** @type {boolean} Чи знищений Event Bus */
        this.isDestroyed = false;
        
        /** @type {number} Лічильник подій для статистики */
        this.eventCount = 0;
    }
    
    /**
     * Емітує подію
     * @param {string} event - Назва події
     * @param {*} data - Дані події
     * @example
     * eventBus.emit('game.start', { boardSize: 5, mode: 'vsComputer' });
     * eventBus.emit('ui.theme.change', { theme: 'dark', style: 'peak' });
     * eventBus.emit('error', { message: 'Помилка з'єднання', code: 500 });
     */
    emit(event, data = {}) {
        if (this.isDestroyed) return;
        
        this.eventCount++;
        
        const eventData = {
            type: event,
            data,
            timestamp: Date.now(),
            id: this.generateEventId(),
            count: this.eventCount
        };
        
        // Застосовуємо middleware
        const processedData = this.applyMiddleware(eventData);
        if (processedData === null) return; // Подію заблоковано
        
        // Сповіщаємо слухачів
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(listener => {
            try {
                listener(processedData);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
                // Емітуємо подію про помилку
                this.emit('error', { 
                    originalEvent: event, 
                    error: error.message,
                    stack: error.stack 
                });
            }
        });
        
        // Логуємо подію в режимі розробки
        if (process.env.NODE_ENV === 'development') {
            console.log(`Event emitted: ${event}`, processedData);
        }
    }
    
    /**
     * Додає слухача події
     * @param {string} event - Назва події
     * @param {Function} handler - Обробник події
     * @returns {Function} Функція для відписки
     * @example
     * const unsubscribe = eventBus.on('game.move', (data) => {
     *     updateBoard(data);
     *     playSound('move');
     * });
     * 
     * // Пізніше відписуємося
     * unsubscribe();
     */
    on(event, handler) {
        if (this.isDestroyed) return () => {};
        
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(handler);
        
        // Повертаємо функцію для відписки
        return () => this.off(event, handler);
    }
    
    /**
     * Додає слухача, який спрацьовує один раз
     * @param {string} event - Назва події
     * @param {Function} handler - Обробник події
     * @example
     * eventBus.once('game.loaded', () => {
     *     showWelcomeMessage();
     * });
     */
    once(event, handler) {
        const onceHandler = (data) => {
            handler(data);
            this.off(event, onceHandler);
        };
        
        this.on(event, onceHandler);
    }
    
    /**
     * Додає middleware
     * @param {Function} middleware - Middleware функція
     * @example
     * // Middleware для логування
     * eventBus.use((eventData) => {
     *     console.log(`[${new Date().toISOString()}] ${eventData.type}`, eventData.data);
     *     return eventData;
     * });
     * 
     * // Middleware для фільтрації
     * eventBus.use((eventData) => {
     *     if (eventData.type === 'debug' && !isDevelopment) {
     *         return null; // Блокуємо debug події в production
     *     }
     *     return eventData;
     * });
     */
    use(middleware) {
        this.middleware.push(middleware);
    }
    
    /**
     * Застосовує middleware до події
     * @param {Object} eventData - Дані події
     * @returns {Object|null} Оброблені дані або null якщо заблоковано
     * @private
     */
    applyMiddleware(eventData) {
        let processedData = eventData;
        
        for (const middleware of this.middleware) {
            try {
                processedData = middleware(processedData);
                if (processedData === null) return null; // Подію заблоковано
            } catch (error) {
                console.error('Middleware error:', error);
                return null;
            }
        }
        
        return processedData;
    }
    
    /**
     * Отримує статистику подій
     * @returns {Object} Статистика
     * @example
     * const stats = eventBus.getStats();
     * console.log(`Total events: ${stats.totalEvents}`);
     * console.log(`Active listeners: ${stats.activeListeners}`);
     */
    getStats() {
        const stats = {
            totalEvents: this.eventCount,
            activeListeners: 0,
            events: {},
            middleware: this.middleware.length
        };
        
        for (const [event, listeners] of this.listeners) {
            stats.events[event] = listeners.length;
            stats.activeListeners += listeners.length;
        }
        
        return stats;
    }
}

// Middleware приклади

/**
 * Middleware для логування подій
 * @param {Object} options - Опції логування
 * @returns {Function} Middleware функція
 */
export function createLoggerMiddleware(options = {}) {
    const {
        enabled = process.env.NODE_ENV === 'development',
        level = 'info',
        filter = () => true,
        formatter = (eventData) => `[${eventData.type}] ${JSON.stringify(eventData.data)}`
    } = options;
    
    return (eventData) => {
        if (!enabled) return eventData;
        if (!filter(eventData)) return eventData;
        
        const message = formatter(eventData);
        
        switch (level) {
            case 'error':
                console.error(message);
                break;
            case 'warn':
                console.warn(message);
                break;
            case 'debug':
                console.debug(message);
                break;
            default:
                console.log(message);
        }
        
        return eventData;
    };
}

/**
 * Middleware для аналітики
 * @param {Object} tracker - Аналітичний трекер
 * @returns {Function} Middleware функція
 */
export function createAnalyticsMiddleware(tracker) {
    return (eventData) => {
        if (tracker && typeof tracker.track === 'function') {
            tracker.track(eventData.type, {
                ...eventData.data,
                timestamp: eventData.timestamp,
                eventId: eventData.id
            });
        }
        
        return eventData;
    };
}

/**
 * Middleware для дебаунсингу
 * @param {number} delay - Затримка в мілісекундах
 * @returns {Function} Middleware функція
 */
export function createDebounceMiddleware(delay = 100) {
    const timers = new Map();
    
    return (eventData) => {
        const key = eventData.type;
        
        if (timers.has(key)) {
            clearTimeout(timers.get(key));
        }
        
        const timer = setTimeout(() => {
            timers.delete(key);
        }, delay);
        
        timers.set(key, timer);
        
        return eventData;
    };
}
```

## 3. Система кешування

### DOM кеш з автоматичним очищенням

```javascript
/**
 * Кеш для DOM-елементів з автоматичним очищенням
 * @class DOMCache
 * @example
 * const domCache = new DOMCache();
 * 
 * // Отримуємо елемент (кешується автоматично)
 * const button = domCache.get('#start-game-btn');
 * 
 * // Отримуємо всі елементи
 * const cells = domCache.getAll('.cell');
 * 
 * // Очищуємо кеш
 * domCache.clear();
 */
class DOMCache {
    constructor(options = {}) {
        const {
            maxSize = 100,
            ttl = 5 * 60 * 1000, // 5 хвилин
            autoCleanup = true,
            cleanupInterval = 60 * 1000 // 1 хвилина
        } = options;
        
        /** @type {Map<string, CacheEntry>} Кеш елементів */
        this.cache = new Map();
        
        /** @type {Map<Element, MutationObserver>} Спостерігачі за змінами */
        this.observers = new Map();
        
        /** @type {number} Максимальний розмір кешу */
        this.maxSize = maxSize;
        
        /** @type {number} Time to live в мілісекундах */
        this.ttl = ttl;
        
        /** @type {boolean} Автоматичне очищення */
        this.autoCleanup = autoCleanup;
        
        /** @type {number} Інтервал очищення */
        this.cleanupInterval = cleanupInterval;
        
        /** @type {number} Лічильник попадань в кеш */
        this.hits = 0;
        
        /** @type {number} Лічильник промахів кешу */
        this.misses = 0;
        
        // Запускаємо автоматичне очищення
        if (this.autoCleanup) {
            this.startAutoCleanup();
        }
    }
    
    /**
     * Отримує елемент з кешу або DOM
     * @param {string} selector - CSS селектор
     * @param {Element} [context] - Контекст пошуку
     * @returns {Element|null} DOM елемент
     * @example
     * const button = domCache.get('#start-game-btn');
     * const cell = domCache.get('.cell', gameBoard);
     */
    get(selector, context = document) {
        const key = this.getCacheKey(selector, context);
        
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            
            // Перевіряємо TTL
            if (Date.now() - cached.timestamp > this.ttl) {
                this.cache.delete(key);
                this.misses++;
            } else if (this.isElementValid(cached.element)) {
                this.hits++;
                return cached.element;
            } else {
                this.cache.delete(key);
                this.misses++;
            }
        } else {
            this.misses++;
        }
        
        const element = context.querySelector(selector);
        if (element) {
            this.set(key, element);
        }
        
        return element;
    }
    
    /**
     * Отримує всі елементи з кешу або DOM
     * @param {string} selector - CSS селектор
     * @param {Element} [context] - Контекст пошуку
     * @returns {NodeList} Список DOM елементів
     * @example
     * const cells = domCache.getAll('.cell');
     * const buttons = domCache.getAll('button', modal);
     */
    getAll(selector, context = document) {
        const key = this.getCacheKey(selector, context);
        
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            
            if (Date.now() - cached.timestamp > this.ttl) {
                this.cache.delete(key);
                this.misses++;
            } else if (this.isElementListValid(cached.elements)) {
                this.hits++;
                return cached.elements;
            } else {
                this.cache.delete(key);
                this.misses++;
            }
        } else {
            this.misses++;
        }
        
        const elements = context.querySelectorAll(selector);
        if (elements.length > 0) {
            this.set(key, elements);
        }
        
        return elements;
    }
    
    /**
     * Встановлює елемент в кеш
     * @param {string} key - Ключ кешу
     * @param {Element|NodeList} element - DOM елемент або список
     * @private
     */
    set(key, element) {
        // Обмежуємо розмір кешу
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        
        this.cache.set(key, {
            element: element,
            timestamp: Date.now(),
            accessCount: 0
        });
        
        // Додаємо спостерігач за змінами
        this.observeElement(element);
    }
    
    /**
     * Видаляє найстаріший елемент з кешу
     * @private
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, entry] of this.cache) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
    
    /**
     * Отримує статистику кешу
     * @returns {Object} Статистика
     * @example
     * const stats = domCache.getStats();
     * console.log(`Hit rate: ${stats.hitRate}%`);
     * console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
     */
    getStats() {
        const totalRequests = this.hits + this.misses;
        const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: Math.round(hitRate * 100) / 100,
            memoryUsage: this.estimateMemoryUsage(),
            ttl: this.ttl
        };
    }
    
    /**
     * Оцінює використання пам'яті
     * @returns {number} Розмір в байтах
     * @private
     */
    estimateMemoryUsage() {
        let size = 0;
        for (const [key, value] of this.cache) {
            size += key.length * 2; // UTF-16
            size += 8; // timestamp
            size += 8; // accessCount
            size += 8; // element reference
        }
        return size;
    }
}
```

## 4. Система тестування

### Unit тести для компонентів

```javascript
/**
 * Unit тести для BaseComponent
 */
describe('BaseComponent', () => {
    let component;
    let element;
    
    beforeEach(() => {
        element = document.createElement('div');
        element.innerHTML = `
            <button class="test-btn">Test</button>
            <span class="test-text">Hello</span>
        `;
        document.body.appendChild(element);
        
        component = new TestComponent(element);
    });
    
    afterEach(() => {
        component.destroy();
        document.body.removeChild(element);
    });
    
    describe('constructor', () => {
        test('should initialize component correctly', () => {
            expect(component.element).toBe(element);
            expect(component.isDestroyed).toBe(false);
            expect(component.renderCount).toBe(1);
        });
    });
    
    describe('event handling', () => {
        test('should add event listener', () => {
            const mockHandler = jest.fn();
            component.addEventListener('.test-btn', 'click', mockHandler);
            
            element.querySelector('.test-btn').click();
            expect(mockHandler).toHaveBeenCalled();
        });
        
        test('should remove event listener', () => {
            const mockHandler = jest.fn();
            component.addEventListener('.test-btn', 'click', mockHandler);
            component.removeEventListener('.test-btn', 'click');
            
            element.querySelector('.test-btn').click();
            expect(mockHandler).not.toHaveBeenCalled();
        });
    });
    
    describe('DOM manipulation', () => {
        test('should set text content', () => {
            component.setText('.test-text', 'New text');
            expect(element.querySelector('.test-text').textContent).toBe('New text');
        });
        
        test('should add class', () => {
            component.addClass('.test-btn', 'active');
            expect(element.querySelector('.test-btn').classList.contains('active')).toBe(true);
        });
        
        test('should remove class', () => {
            element.querySelector('.test-btn').classList.add('active');
            component.removeClass('.test-btn', 'active');
            expect(element.querySelector('.test-btn').classList.contains('active')).toBe(false);
        });
    });
    
    describe('state subscription', () => {
        test('should subscribe to state changes', () => {
            const mockCallback = jest.fn();
            component.subscribe('game.points', mockCallback);
            
            stateManager.setState('game.points', 10);
            expect(mockCallback).toHaveBeenCalledWith(10);
        });
    });
    
    describe('lifecycle', () => {
        test('should destroy component correctly', () => {
            const mockHandler = jest.fn();
            component.addEventListener('.test-btn', 'click', mockHandler);
            
            component.destroy();
            
            expect(component.isDestroyed).toBe(true);
            expect(component.subscriptions.length).toBe(0);
            expect(component.eventListeners.size).toBe(0);
            
            element.querySelector('.test-btn').click();
            expect(mockHandler).not.toHaveBeenCalled();
        });
    });
});

/**
 * Тестовий компонент для тестування
 */
class TestComponent extends BaseComponent {
    render() {
        this.renderCount++;
    }
    
    bindEvents() {
        // Тестова реалізація
    }
    
    subscribeToState() {
        // Тестова реалізація
    }
}
```

## 5. Система логування

### Централізований логер

```javascript
/**
 * Централізована система логування
 * @class Logger
 * @example
 * Logger.info('Game started', { boardSize: 5, mode: 'vsComputer' });
 * Logger.error('Connection failed', { error: 'Network error', code: 500 });
 * Logger.debug('State updated', { path: 'game.points', value: 10 });
 */
class Logger {
    static levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
    
    static config = {
        level: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'ERROR',
        maxLogs: 1000,
        persistToStorage: true,
        sendToServer: false,
        serverUrl: null
    };
    
    static logs = [];
    
    /**
     * Логує повідомлення
     * @param {string} level - Рівень логування
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
     * @example
     * Logger.log('INFO', 'User action', { action: 'click', target: 'start-btn' });
     */
    static log(level, message, data = {}) {
        if (this.levels[level] > this.levels[this.config.level]) {
            return;
        }
        
        const logEntry = {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            id: this.generateLogId(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Додаємо до пам'яті
        this.logs.push(logEntry);
        
        // Обмежуємо розмір
        if (this.logs.length > this.config.maxLogs) {
            this.logs.shift();
        }
        
        // Виводимо в консоль
        this.outputToConsole(logEntry);
        
        // Зберігаємо в localStorage
        if (this.config.persistToStorage) {
            this.saveToStorage(logEntry);
        }
        
        // Відправляємо на сервер
        if (this.config.sendToServer && this.config.serverUrl) {
            this.sendToServer(logEntry);
        }
    }
    
    /**
     * Логує помилку
     * @param {string} message - Повідомлення про помилку
     * @param {Object} data - Додаткові дані
     */
    static error(message, data = {}) {
        this.log('ERROR', message, data);
    }
    
    /**
     * Логує попередження
     * @param {string} message - Повідомлення попередження
     * @param {Object} data - Додаткові дані
     */
    static warn(message, data = {}) {
        this.log('WARN', message, data);
    }
    
    /**
     * Логує інформацію
     * @param {string} message - Інформаційне повідомлення
     * @param {Object} data - Додаткові дані
     */
    static info(message, data = {}) {
        this.log('INFO', message, data);
    }
    
    /**
     * Логує для дебагу
     * @param {string} message - Дебаг повідомлення
     * @param {Object} data - Додаткові дані
     */
    static debug(message, data = {}) {
        this.log('DEBUG', message, data);
    }
    
    /**
     * Виводить лог в консоль
     * @param {Object} logEntry - Запис логу
     * @private
     */
    static outputToConsole(logEntry) {
        const { level, message, data, timestamp } = logEntry;
        const prefix = `[${timestamp}] [${level}]`;
        
        switch (level) {
            case 'ERROR':
                console.error(prefix, message, data);
                break;
            case 'WARN':
                console.warn(prefix, message, data);
                break;
            case 'DEBUG':
                console.debug(prefix, message, data);
                break;
            default:
                console.log(prefix, message, data);
        }
    }
    
    /**
     * Зберігає лог в localStorage
     * @param {Object} logEntry - Запис логу
     * @private
     */
    static saveToStorage(logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
            logs.push(logEntry);
            
            // Обмежуємо розмір
            if (logs.length > this.config.maxLogs) {
                logs.splice(0, logs.length - this.config.maxLogs);
            }
            
            localStorage.setItem('app_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save log to storage:', error);
        }
    }
    
    /**
     * Відправляє лог на сервер
     * @param {Object} logEntry - Запис логу
     * @private
     */
    static async sendToServer(logEntry) {
        try {
            await fetch(this.config.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            console.error('Failed to send log to server:', error);
        }
    }
    
    /**
     * Отримує всі логи
     * @returns {Array} Масив логів
     */
    static getLogs() {
        return [...this.logs];
    }
    
    /**
     * Очищує логи
     */
    static clearLogs() {
        this.logs = [];
        localStorage.removeItem('app_logs');
    }
    
    /**
     * Експортує логи
     * @returns {string} JSON рядок з логами
     */
    static exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    
    /**
     * Генерує унікальний ID для логу
     * @returns {string} Унікальний ID
     * @private
     */
    static generateLogId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
```

Ці приклади демонструють практичні способи реалізації ключових покращень архітектури. Вони можуть бути адаптовані та інтегровані в існуючий код проекту поступово, без порушення поточної функціональності.

## 🚀 НОВІ НАПРЯМКИ ДЛЯ ПОДАЛЬШОГО РОЗВИТКУ

### 📊 Аналіз поточного стану

Проект "Stay on the board" вже має досить розвинену архітектуру з компонентами, State Manager, та іншими сучасними патернами. Однак є кілька ключових напрямків для подальшого покращення:

#### ✅ Що вже реалізовано добре:
1. **Компонентна архітектура** - всі основні UI елементи винесені в компоненти
2. **State Management** - централізоване управління станом з підпискою
3. **View Manager** - система навігації між екранами
4. **DOM Utilities** - багатий набір утиліт для роботи з DOM
5. **Модульна структура** - код розділений на логічні модулі
6. **Інтернаціоналізація** - підтримка 4 мов
7. **Система тем** - CSS-змінні для різних стилів

#### ⚠️ Області для покращення:
1. **Відсутність системи подій** - немає централізованого Event Bus
2. **Обмежена типізація** - відсутній TypeScript або JSDoc
3. **Відсутність кешування** - немає системи кешування DOM елементів
4. **Обмежене тестування** - відсутні unit тести
5. **Відсутність логування** - немає централізованої системи логування
6. **Обмежена продуктивність** - немає оптимізації рендерингу
7. **Відсутність аналітики** - немає системи збору метрик

### 🎯 Рекомендовані наступні кроки

#### 1. **Система подій (Event System)** - ВИСОКИЙ ПРІОРИТЕТ
Створити централізовану систему подій для зв'язку між компонентами.

#### 2. **Система тестування** - ВИСОКИЙ ПРІОРИТЕТ
Додати unit тести для всіх компонентів та функцій.

#### 3. **Покращена типізація** - ВИСОКИЙ ПРІОРИТЕТ
Додати JSDoc або TypeScript для кращої типобезпеки.

#### 4. **Система кешування** - СЕРЕДНІЙ ПРІОРИТЕТ
Оптимізувати продуктивність через кешування DOM елементів.

#### 5. **Система логування** - СЕРЕДНІЙ ПРІОРИТЕТ
Централізоване логування для дебагу та моніторингу.

#### 6. **Оптимізація продуктивності** - СЕРЕДНІЙ ПРІОРИТЕТ
Покращити швидкість рендерингу та відгук.

#### 7. **Система аналітики** - НИЗЬКИЙ ПРІОРИТЕТ
Збирати метрики використання додатку.

### 📋 План реалізації

#### Фаза 1: Система подій (2-3 тижні)
- Створити `js/event-bus.js`
- Інтегрувати з існуючими компонентами
- Додати middleware для логування

#### Фаза 2: Система тестування (3-4 тижні)
- Налаштувати тестове середовище
- Створити unit тести для компонентів
- Створити integration тести

#### Фаза 3: Покращена типізація (2-3 тижні)
- Додати JSDoc до всіх функцій
- Створити типи для всіх об'єктів
- Створити документацію API

### 🎯 Очікувані результати

Після реалізації всіх покращень очікуємо:
- ✅ **Зменшення кількості помилок** на 60-80%
- ✅ **Покращення продуктивності** на 30-50%
- ✅ **Зменшення часу розробки** на 40-60%
- ✅ **Покращення підтримки коду** на 70-90%
- ✅ **Збільшення стабільності** на 80-95%

Цей план забезпечить поступовий перехід до сучасної архітектури без порушення існуючої функціональності, зберігаючи при цьому простоту та зрозумілість коду. 