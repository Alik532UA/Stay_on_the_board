# Тип: План
# Статус: Виконано
# Назва: Детальний план реалізації покращень архітектури
# Опис: Завершений покроковий план впровадження сучасних принципів та патернів у кодову базу Твій Хід. Містить всі етапи, чеклісти та підсумки виконання.

## 🎯 Мета
Поступово впровадити сучасні принципи та патерни в існуючу ванільну JS-кодову базу, щоб зробити її більш стабільною, масштабованою та легкою для підтримки.

## 🚀 Фаза 1: Типізація та документація (1-2 місяці)

### 📊 Аналіз поточного стану
Проект вже має досить розвинену архітектуру з компонентами, State Manager, та іншими сучасними патернами. Однак є кілька ключових напрямків для подальшого покращення:

#### ✅ Що вже реалізовано добре:
1. **Компонентна архітектура** - всі основні UI елементи винесені в компоненти
2. **State Management** - централізоване управління станом з підпискою
3. **View Manager** - система навігації між екранами
4. **DOM Utilities** - багатий набір утиліт для роботи з DOM
5. **Модульна структура** - код розділений на логічні модулі

#### ⚠️ Області для покращення:
1. **Відсутність системи подій** - немає централізованого Event Bus
2. **Обмежена типізація** - відсутній TypeScript або JSDoc
3. **Відсутність кешування** - немає системи кешування DOM елементів
4. **Обмежене тестування** - відсутні unit тести
5. **Відсутність логування** - немає централізованої системи логування

### 1.1 JSDoc документація

**Файли для оновлення:**
- `js/state-manager.js`
- `js/components/base-component.js`
- `js/view-manager.js`
- `js/game-logic-improved.js`
- `js/utils/dom-utils.js`

**Приклад реалізації:**
```javascript
/**
 * Централізований менеджер стану додатку
 * @class StateManager
 */
class StateManager {
    /**
     * Створює новий екземпляр StateManager
     * @constructor
     */
    constructor() {
        /** @type {Object} Поточний стан додатку */
        this.state = { /* ... */ };
        
        /** @type {Map<string, Map<number, Function>>} Підписники на зміни стану */
        this.subscribers = new Map();
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
     */
    getState(path = null) {
        // Реалізація
    }
    
    /**
     * Встановлює значення в стані
     * @param {string} path - Шлях до властивості
     * @param {*} value - Нове значення
     * @returns {boolean} Чи успішно оновлено
     * @throws {Error} Якщо шлях недійсний
     */
    setState(path, value) {
        // Реалізація
    }
}
```

### 1.2 TypeScript definitions

**Створити файл:** `js/types.d.ts`

```typescript
// Типи для State Manager
export interface AppState {
    settings: SettingsState;
    game: GameState;
    ui: UIState;
}

export interface SettingsState {
    language: 'uk' | 'en' | 'nl' | 'crh';
    theme: 'light' | 'dark';
    style: 'classic' | 'peak' | 'cs2' | 'glass' | 'material';
    speechEnabled: boolean;
    showBoard: boolean;
    showMoves: boolean;
    blockedMode: boolean;
}

export interface GameState {
    isActive: boolean;
    board: number[][];
    currentPlayer: 1 | 2;
    points: number;
    selectedDirection: string | null;
    selectedDistance: number | null;
    blockedCells: Array<{row: number, col: number}>;
    availableMoves: Array<{row: number, col: number}>;
    showingAvailableMoves: boolean;
    gameMode: 'vsComputer' | 'localTwoPlayer' | 'online' | null;
    playerNames: { p1: string; p2: string };
    boardSize: number;
    selectedMove: any;
    moveConfirmed: boolean;
    noMoves: boolean;
    gameHistory: any[];
    lastMove: any;
}

export interface UIState {
    currentView: 'mainMenu' | 'game' | 'settings';
    modal: {
        isOpen: boolean;
        title: string;
        content: string;
        buttons: Array<{text: string; action: string; primary?: boolean}>;
    };
    topControls: {
        isVisible: boolean;
    };
    loading: boolean;
    error: string | null;
}

// Типи для компонентів
export interface ComponentOptions {
    [key: string]: any;
}

export interface BaseComponent {
    element: HTMLElement;
    options: ComponentOptions;
    subscriptions: Array<() => void>;
    eventListeners: Map<string, {element: HTMLElement; event: string; handler: Function}>;
    isDestroyed: boolean;
    renderCount: number;
}

// Типи для подій
export interface GameEvent {
    type: string;
    data: any;
    timestamp: number;
}

// Типи для валідації
export interface ValidationRule {
    test: (value: any) => boolean;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
```

### 1.3 Валідація типів під час розробки

**Створити файл:** `js/type-checker.js`

```javascript
/**
 * Простий валідатор типів для розробки
 */
class TypeChecker {
    static isDevelopment = process.env.NODE_ENV === 'development';
    
    /**
     * Перевіряє тип значення
     * @param {*} value - Значення для перевірки
     * @param {string} expectedType - Очікуваний тип
     * @param {string} context - Контекст перевірки
     */
    static checkType(value, expectedType, context = '') {
        if (!this.isDevelopment) return;
        
        let actualType = typeof value;
        
        if (actualType === 'object' && value === null) {
            actualType = 'null';
        } else if (Array.isArray(value)) {
            actualType = 'array';
        }
        
        if (actualType !== expectedType) {
            console.warn(`Type mismatch in ${context}: expected ${expectedType}, got ${actualType}`, value);
        }
    }
    
    /**
     * Перевіряє структуру об'єкта
     * @param {Object} obj - Об'єкт для перевірки
     * @param {Object} schema - Схема об'єкта
     * @param {string} context - Контекст перевірки
     */
    static checkSchema(obj, schema, context = '') {
        if (!this.isDevelopment) return;
        
        for (const [key, expectedType] of Object.entries(schema)) {
            if (obj.hasOwnProperty(key)) {
                this.checkType(obj[key], expectedType, `${context}.${key}`);
            } else {
                console.warn(`Missing property ${key} in ${context}`);
            }
        }
    }
}

// Експорт для використання
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TypeChecker;
} else {
    window.TypeChecker = TypeChecker;
}

## 🚀 Фаза 3: Система кешування - СЕРЕДНІЙ ПРІОРИТЕТ (1-2 тижні)

### 🎯 Мета
Оптимізувати продуктивність через кешування DOM елементів та важких обчислень.

### ✅ Переваги
- Швидший доступ до DOM елементів
- Зменшення кількості DOM запитів
- Автоматичне очищення кешу
- Статистика використання

### 3.1 DOM Cache Manager

**Створити файл:** `js/utils/cache-manager.js`

```javascript
/**
 * Кеш для DOM-елементів з автоматичним очищенням
 */
class DOMCache {
    constructor(options = {}) {
        const {
            maxSize = 100,
            ttl = 5 * 60 * 1000, // 5 хвилин
            autoCleanup = true
        } = options;
        
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.autoCleanup = autoCleanup;
        this.hits = 0;
        this.misses = 0;
        
        if (this.autoCleanup) {
            this.startAutoCleanup();
        }
    }
    
    /**
     * Отримує елемент з кешу або DOM
     * @param {string} selector - CSS селектор
     * @param {Element} [context] - Контекст пошуку
     * @returns {Element|null} DOM елемент
     */
    get(selector, context = document) {
        const key = this.getCacheKey(selector, context);
        
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            
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
     * Отримує статистику кешу
     * @returns {Object} Статистика
     */
    getStats() {
        const totalRequests = this.hits + this.misses;
        const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }
}
```

## 🚀 Фаза 4: Система логування - СЕРЕДНІЙ ПРІОРИТЕТ (1-2 тижні)

### 🎯 Мета
Централізоване логування для дебагу та моніторингу додатку.

### ✅ Переваги
- Структуровані логи
- Різні рівні логування
- Збереження в localStorage
- Відправка на сервер
- Фільтрація та пошук

### 4.1 Logger

**Створити файл:** `js/utils/logger.js`

```javascript
/**
 * Централізована система логування
 */
class Logger {
    static levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
    
    static config = {
        level: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'ERROR',
        maxLogs: 1000,
        persistToStorage: true,
        sendToServer: false
    };
    
    static logs = [];
    
    /**
     * Логує повідомлення
     * @param {string} level - Рівень логування
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
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
            id: this.generateLogId()
        };
        
        this.logs.push(logEntry);
        
        if (this.logs.length > this.config.maxLogs) {
            this.logs.shift();
        }
        
        this.outputToConsole(logEntry);
        
        if (this.config.persistToStorage) {
            this.saveToStorage(logEntry);
        }
    }
    
    static error(message, data = {}) { this.log('ERROR', message, data); }
    static warn(message, data = {}) { this.log('WARN', message, data); }
    static info(message, data = {}) { this.log('INFO', message, data); }
    static debug(message, data = {}) { this.log('DEBUG', message, data); }
}
```

## 🚀 Фаза 5: Система тестування - ВИСОКИЙ ПРІОРИТЕТ (3-4 тижні)

### 🎯 Мета
Додати unit тести для всіх компонентів та функцій.

### ✅ Переваги
- Перевірка функціональності
- Регресійне тестування
- Документація через тести
- Безпечні рефакторинги

### 5.1 Unit тести

**Створити директорію:** `tests/unit/`

```javascript
/**
 * Unit тести для StateManager
 */
describe('StateManager', () => {
    let stateManager;
    
    beforeEach(() => {
        stateManager = new StateManager();
    });
    
    afterEach(() => {
        stateManager = null;
    });
    
    test('should initialize with default state', () => {
        const state = stateManager.getState();
        expect(state.settings.language).toBe('uk');
        expect(state.game.isActive).toBe(false);
    });
    
    test('should update state correctly', () => {
        stateManager.setState('game.points', 10);
        expect(stateManager.getState('game.points')).toBe(10);
    });
    
    test('should notify subscribers', () => {
        const mockCallback = jest.fn();
        stateManager.subscribe('game.points', mockCallback);
        stateManager.setState('game.points', 15);
        expect(mockCallback).toHaveBeenCalledWith(15);
    });
});
```

## 🚀 Фаза 6: Оптимізація продуктивності - СЕРЕДНІЙ ПРІОРИТЕТ (2-3 тижні)

### 🎯 Мета
Покращити швидкість рендерингу та відгук додатку.

### ✅ Переваги
- Швидший UI
- Менше використання CPU
- Кращий UX
- Підтримка слабких пристроїв

### 6.1 Оптимізації

1. **Virtual Scrolling** для великих списків
2. **Lazy Loading** компонентів
3. **Debouncing** подій
4. **Оптимізація анімацій**
5. **Мемоізація** важких обчислень

## 🚀 Фаза 7: Система аналітики - НИЗЬКИЙ ПРІОРИТЕТ (1-2 тижні)

### 🎯 Мета
Збирати метрики використання додатку для аналізу поведінки користувачів.

### ✅ Переваги
- Розуміння поведінки користувачів
- Виявлення проблем
- Оптимізація UX
- A/B тестування

### 7.1 Analytics

**Створити файл:** `js/utils/analytics.js`

```javascript
/**
 * Система аналітики
 */
class Analytics {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
    }
    
    /**
     * Відстежує подію
     * @param {string} event - Назва події
     * @param {Object} data - Дані події
     */
    track(event, data = {}) {
        const eventData = {
            event,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href
        };
        
        this.events.push(eventData);
        
        // Відправляємо на сервер або зберігаємо локально
        this.sendToServer(eventData);
    }
    
    /**
     * Відстежує помилку
     * @param {Error} error - Об'єкт помилки
     */
    trackError(error) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });
    }
}
```

## 📊 Пріоритети реалізації

### 🟢 ВИСОКИЙ ПРІОРИТЕТ (1-3 місяці)
1. **Система подій (Event System)** - розв'язування компонентів
2. **Система тестування** - забезпечення стабільності
3. **Покращена типізація** - зменшення помилок

### 🟡 СЕРЕДНІЙ ПРІОРИТЕТ (3-6 місяців)
4. **Система кешування** - покращення продуктивності
5. **Система логування** - полегшення дебагу
6. **Оптимізація продуктивності** - швидший UI

### 🔴 НИЗЬКИЙ ПРІОРИТЕТ (6+ місяців)
7. **Система аналітики** - розуміння користувачів
8. **Додаткові оптимізації** - фінальні покращення
9. **Розширені функції** - нові можливості

## 🎯 Очікувані результати

Після реалізації всіх покращень очікуємо:
- ✅ **Зменшення кількості помилок** на 60-80%
- ✅ **Покращення продуктивності** на 30-50%
- ✅ **Зменшення часу розробки** на 40-60%
- ✅ **Покращення підтримки коду** на 70-90%
- ✅ **Збільшення стабільності** на 80-95%

## 🔧 Технічні вимоги

- **Сумісність:** Підтримка всіх сучасних браузерів
- **Продуктивність:** Завантаження < 2 секунд
- **Розмір:** Загальний розмір JS < 500KB
- **Тестування:** Покриття тестами > 80%
- **Документація:** 100% API задокументовано
```

## 🚀 Фаза 2: Система подій (Event System) - ВИСОКИЙ ПРІОРИТЕТ (2-3 тижні)

### 🎯 Мета
Створити централізовану систему подій для зв'язку між компонентами, що дозволить розв'язати компоненти та покращити архітектуру.

### ✅ Переваги
- Розв'язування компонентів
- Легше тестування
- Кращий контроль потоку даних
- Можливість middleware
- Дебаг та логування подій

### 2.1 Event Bus

**Створити файл:** `js/event-bus.js`

```javascript
/**
 * Централізована система подій
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.middleware = [];
        this.isDestroyed = false;
    }
    
    /**
     * Емітує подію
     * @param {string} event - Назва події
     * @param {*} data - Дані події
     */
    emit(event, data = {}) {
        if (this.isDestroyed) return;
        
        const eventData = {
            type: event,
            data,
            timestamp: Date.now(),
            id: this.generateEventId()
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
     * Видаляє слухача події
     * @param {string} event - Назва події
     * @param {Function} handler - Обробник події
     */
    off(event, handler) {
        if (this.isDestroyed) return;
        
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(handler);
            if (index > -1) {
                listeners.splice(index, 1);
            }
            
            if (listeners.length === 0) {
                this.listeners.delete(event);
            }
        }
    }
    
    /**
     * Додає слухача, який спрацьовує один раз
     * @param {string} event - Назва події
     * @param {Function} handler - Обробник події
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
     */
    use(middleware) {
        this.middleware.push(middleware);
    }
    
    /**
     * Застосовує middleware до події
     * @param {Object} eventData - Дані події
     * @returns {Object|null} Оброблені дані або null якщо заблоковано
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
     * Генерує унікальний ID для події
     * @returns {string} Унікальний ID
     */
    generateEventId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Очищує всі слухачі
     */
    clear() {
        this.listeners.clear();
    }
    
    /**
     * Знищує Event Bus
     */
    destroy() {
        this.clear();
        this.middleware = [];
        this.isDestroyed = true;
    }
    
    /**
     * Отримує статистику подій
     * @returns {Object} Статистика
     */
    getStats() {
        const stats = {
            totalEvents: 0,
            activeListeners: 0,
            events: {}
        };
        
        for (const [event, listeners] of this.listeners) {
            stats.events[event] = listeners.length;
            stats.activeListeners += listeners.length;
        }
        
        return stats;
    }
}

// Створюємо глобальний екземпляр
const eventBus = new EventBus();

// Експорт
export { EventBus, eventBus };
```

### 2.2 Інтеграція з State Manager

**Оновити файл:** `js/state-manager.js`

```javascript
import { eventBus } from './event-bus.js';

class StateManager {
    constructor() {
        // ... існуючий код ...
        
        // Інтеграція з Event Bus
        this.setupEventIntegration();
    }
    
    setupEventIntegration() {
        // Емітуємо події при зміні стану
        this.originalSetState = this.setState;
        this.setState = (path, value) => {
            const oldValue = this.getState(path);
            const success = this.originalSetState(path, value);
            
            if (success) {
                eventBus.emit('state.changed', {
                    path,
                    oldValue,
                    newValue: value,
                    timestamp: Date.now()
                });
                
                eventBus.emit(`state.changed.${path}`, {
                    oldValue,
                    newValue: value,
                    timestamp: Date.now()
                });
            }
            
            return success;
        };
    }
    
    // ... існуючий код ...
}
```

### 2.3 Middleware для логування

**Створити файл:** `js/middleware/logger.js`

```javascript
/**
 * Middleware для логування подій
 */
export function createLoggerMiddleware(options = {}) {
    const {
        enabled = process.env.NODE_ENV === 'development',
        level = 'info',
        filter = () => true
    } = options;
    
    return (eventData) => {
        if (!enabled) return eventData;
        if (!filter(eventData)) return eventData;
        
        const logLevel = eventData.level || level;
        const message = `[${eventData.type}] ${JSON.stringify(eventData.data)}`;
        
        switch (logLevel) {
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
 */
export function createAnalyticsMiddleware(tracker) {
    return (eventData) => {
        // Відправляємо подію в аналітику
        if (tracker && typeof tracker.track === 'function') {
            tracker.track(eventData.type, eventData.data);
        }
        
        return eventData;
    };
}
```

## 🚀 Фаза 3: Система тестування (2-3 місяці)

### 3.1 Unit тести

**Створити файл:** `tests/state-manager.test.js`

```javascript
/**
 * Unit тести для State Manager
 */
describe('StateManager', () => {
    let stateManager;
    
    beforeEach(() => {
        stateManager = new StateManager();
    });
    
    afterEach(() => {
        stateManager.destroy();
    });
    
    describe('getState', () => {
        test('should return entire state when no path provided', () => {
            const state = stateManager.getState();
            expect(state).toHaveProperty('settings');
            expect(state).toHaveProperty('game');
            expect(state).toHaveProperty('ui');
        });
        
        test('should return specific property when path provided', () => {
            const points = stateManager.getState('game.points');
            expect(points).toBe(0);
        });
        
        test('should return undefined for invalid path', () => {
            const value = stateManager.getState('invalid.path');
            expect(value).toBeUndefined();
        });
    });
    
    describe('setState', () => {
        test('should update state correctly', () => {
            stateManager.setState('game.points', 10);
            expect(stateManager.getState('game.points')).toBe(10);
        });
        
        test('should notify subscribers', () => {
            const mockCallback = jest.fn();
            stateManager.subscribe('game.points', mockCallback);
            
            stateManager.setState('game.points', 15);
            
            expect(mockCallback).toHaveBeenCalledWith(15, 0);
        });
        
        test('should validate values', () => {
            const result = stateManager.setState('game.currentPlayer', 3);
            expect(result).toBe(false);
            expect(stateManager.getState('game.currentPlayer')).toBe(1);
        });
    });
    
    describe('subscribe', () => {
        test('should add subscriber', () => {
            const mockCallback = jest.fn();
            const unsubscribe = stateManager.subscribe('game.points', mockCallback);
            
            expect(typeof unsubscribe).toBe('function');
        });
        
        test('should remove subscriber when unsubscribe called', () => {
            const mockCallback = jest.fn();
            const unsubscribe = stateManager.subscribe('game.points', mockCallback);
            
            unsubscribe();
            stateManager.setState('game.points', 20);
            
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });
    
    describe('undo/redo', () => {
        test('should support undo operation', () => {
            stateManager.setState('game.points', 10);
            stateManager.setState('game.points', 20);
            
            stateManager.undo();
            expect(stateManager.getState('game.points')).toBe(10);
        });
        
        test('should support redo operation', () => {
            stateManager.setState('game.points', 10);
            stateManager.setState('game.points', 20);
            stateManager.undo();
            
            stateManager.redo();
            expect(stateManager.getState('game.points')).toBe(20);
        });
    });
});
```

### 3.2 Integration тести

**Створити файл:** `tests/integration.test.js`

```javascript
/**
 * Integration тести
 */
describe('Integration Tests', () => {
    let app;
    
    beforeEach(() => {
        // Створюємо тестове середовище
        document.body.innerHTML = `
            <div id="main-menu" class="view active"></div>
            <div id="game" class="view"></div>
            <div id="settings" class="view"></div>
        `;
        
        app = new App();
    });
    
    afterEach(() => {
        app.destroy();
        document.body.innerHTML = '';
    });
    
    test('should navigate between views', () => {
        // Перевіряємо початковий стан
        expect(document.getElementById('main-menu').classList.contains('active')).toBe(true);
        
        // Переходимо до гри
        stateManager.navigateTo('game');
        expect(document.getElementById('game').classList.contains('active')).toBe(true);
        expect(document.getElementById('main-menu').classList.contains('active')).toBe(false);
        
        // Переходимо до налаштувань
        stateManager.navigateTo('settings');
        expect(document.getElementById('settings').classList.contains('active')).toBe(true);
        expect(document.getElementById('game').classList.contains('active')).toBe(false);
    });
    
    test('should update UI when state changes', () => {
        // Змінюємо тему
        stateManager.setState('settings.theme', 'dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        
        // Змінюємо мову
        stateManager.setState('settings.language', 'en');
        // Перевіряємо, що UI оновився
    });
    
    test('should handle game flow', () => {
        // Ініціалізуємо гру
        stateManager.initGame({
            boardSize: 5,
            gameMode: 'vsComputer'
        });
        
        expect(stateManager.getState('game.isActive')).toBe(true);
        expect(stateManager.getState('game.boardSize')).toBe(5);
        
        // Робимо хід
        stateManager.setState('game.selectedDirection', 'up');
        stateManager.setState('game.selectedDistance', 2);
        
        // Підтверджуємо хід
        gameLogic.confirmMove();
        
        // Перевіряємо, що хід виконано
        expect(stateManager.getState('game.lastMove')).toBeTruthy();
    });
});
```

### 3.3 E2E тести

**Створити файл:** `tests/e2e.test.js`

```javascript
/**
 * E2E тести з використанням Playwright
 */
import { test, expect } from '@playwright/test';

test.describe('Твій Хід E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });
    
    test('should load main menu', async ({ page }) => {
        await expect(page.locator('#main-menu')).toBeVisible();
        await expect(page.locator('.game-title')).toHaveText('Твій Хід');
    });
    
    test('should navigate to settings', async ({ page }) => {
        await page.click('#settings-btn');
        await expect(page.locator('#settings')).toBeVisible();
        await expect(page.locator('#main-menu')).not.toBeVisible();
    });
    
    test('should change theme', async ({ page }) => {
        await page.click('#settings-btn');
        await page.selectOption('#theme-select', 'dark');
        
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });
    
    test('should start game', async ({ page }) => {
        await page.click('#start-game-btn');
        await expect(page.locator('#game')).toBeVisible();
        await expect(page.locator('#game-board')).toBeVisible();
    });
    
    test('should play complete game', async ({ page }) => {
        // Починаємо гру
        await page.click('#start-game-btn');
        
        // Вибір напрямку
        await page.click('#direction-grid button[data-direction="up"]');
        
        // Вибір відстані
        await page.click('#distance-selector button[data-distance="2"]');
        
        // Підтвердження ходу
        await page.click('#confirm-move-btn');
        
        // Перевіряємо, що хід виконано
        await expect(page.locator('.cell.piece')).toBeVisible();
    });
    
    test('should handle online game', async ({ page, context }) => {
        // Створюємо другу вкладку для симуляції другого гравця
        const page2 = await context.newPage();
        await page2.goto('http://localhost:3000');
        
        // Створюємо кімнату на першій вкладці
        await page.click('#start-game-btn');
        await page.click('#online-game-btn');
        await page.click('#create-room-btn');
        
        const roomId = await page.locator('#room-id').textContent();
        
        // Приєднуємося до кімнати на другій вкладці
        await page2.click('#start-game-btn');
        await page2.click('#online-game-btn');
        await page2.fill('#room-id-input', roomId);
        await page2.click('#join-room-btn');
        
        // Перевіряємо, що гра почалася
        await expect(page.locator('#game')).toBeVisible();
        await expect(page2.locator('#game')).toBeVisible();
    });
});
```

## 🚀 Фаза 4: Кешування та оптимізація (1-2 місяці)

### 4.1 DOM кеш

**Створити файл:** `js/utils/dom-cache.js`

```javascript
/**
 * Кеш для DOM-елементів
 */
class DOMCache {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
        this.maxSize = 100;
    }
    
    /**
     * Отримує елемент з кешу або DOM
     * @param {string} selector - CSS селектор
     * @param {Element} [context] - Контекст пошуку
     * @returns {Element|null} DOM елемент
     */
    get(selector, context = document) {
        const key = this.getCacheKey(selector, context);
        
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (this.isElementValid(cached.element)) {
                return cached.element;
            } else {
                this.cache.delete(key);
            }
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
     */
    getAll(selector, context = document) {
        const key = this.getCacheKey(selector, context);
        
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (this.isElementListValid(cached.elements)) {
                return cached.elements;
            } else {
                this.cache.delete(key);
            }
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
     */
    set(key, element) {
        // Обмежуємо розмір кешу
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            element: element,
            timestamp: Date.now()
        });
        
        // Додаємо спостерігач за змінами
        this.observeElement(element);
    }
    
    /**
     * Очищує кеш
     */
    clear() {
        this.cache.clear();
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
    
    /**
     * Генерує ключ кешу
     * @param {string} selector - CSS селектор
     * @param {Element} context - Контекст
     * @returns {string} Ключ кешу
     */
    getCacheKey(selector, context) {
        return `${context === document ? 'doc' : context.id || 'ctx'}:${selector}`;
    }
    
    /**
     * Перевіряє чи елемент все ще валідний
     * @param {Element} element - DOM елемент
     * @returns {boolean} Чи валідний елемент
     */
    isElementValid(element) {
        return element && element.parentNode && document.contains(element);
    }
    
    /**
     * Перевіряє чи список елементів валідний
     * @param {NodeList} elements - Список DOM елементів
     * @returns {boolean} Чи валідний список
     */
    isElementListValid(elements) {
        if (!elements || elements.length === 0) return false;
        
        for (let i = 0; i < elements.length; i++) {
            if (!this.isElementValid(elements[i])) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Додає спостерігач за елементом
     * @param {Element|NodeList} element - DOM елемент або список
     */
    observeElement(element) {
        if (element instanceof NodeList) {
            for (let i = 0; i < element.length; i++) {
                this.observeElement(element[i]);
            }
            return;
        }
        
        if (this.observers.has(element)) return;
        
        const observer = new MutationObserver(() => {
            // Елемент змінився, видаляємо з кешу
            this.removeFromCache(element);
        });
        
        observer.observe(element, {
            childList: true,
            subtree: true,
            attributes: true
        });
        
        this.observers.set(element, observer);
    }
    
    /**
     * Видаляє елемент з кешу
     * @param {Element} element - DOM елемент
     */
    removeFromCache(element) {
        for (const [key, cached] of this.cache) {
            if (cached.element === element) {
                this.cache.delete(key);
                break;
            }
        }
        
        const observer = this.observers.get(element);
        if (observer) {
            observer.disconnect();
            this.observers.delete(element);
        }
    }
    
    /**
     * Отримує статистику кешу
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.calculateHitRate(),
            memoryUsage: this.estimateMemoryUsage()
        };
    }
    
    /**
     * Розраховує частоту попадань в кеш
     * @returns {number} Частота попадань (0-1)
     */
    calculateHitRate() {
        // Проста реалізація - можна покращити
        return this.cache.size / this.maxSize;
    }
    
    /**
     * Оцінює використання пам'яті
     * @returns {number} Розмір в байтах
     */
    estimateMemoryUsage() {
        let size = 0;
        for (const [key, value] of this.cache) {
            size += key.length * 2; // UTF-16
            size += 8; // timestamp
            size += 8; // element reference
        }
        return size;
    }
}

// Глобальний екземпляр
const domCache = new DOMCache();

export { DOMCache, domCache };
```

### 4.2 Мемоізація

**Створити файл:** `js/utils/memoize.js`

```javascript
/**
 * Утиліти для мемоізації
 */

/**
 * Мемоізує функцію
 * @param {Function} fn - Функція для мемоізації
 * @param {Object} options - Опції
 * @returns {Function} Мемоізована функція
 */
export function memoize(fn, options = {}) {
    const {
        maxSize = 100,
        ttl = null, // Time to live в мілісекундах
        keyGenerator = JSON.stringify
    } = options;
    
    const cache = new Map();
    
    return function(...args) {
        const key = keyGenerator(args);
        
        if (cache.has(key)) {
            const cached = cache.get(key);
            
            // Перевіряємо TTL
            if (ttl && Date.now() - cached.timestamp > ttl) {
                cache.delete(key);
            } else {
                return cached.value;
            }
        }
        
        const result = fn.apply(this, args);
        
        // Обмежуємо розмір кешу
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        cache.set(key, {
            value: result,
            timestamp: Date.now()
        });
        
        return result;
    };
}

/**
 * Мемоізує асинхронну функцію
 * @param {Function} fn - Асинхронна функція
 * @param {Object} options - Опції
 * @returns {Function} Мемоізована асинхронна функція
 */
export function memoizeAsync(fn, options = {}) {
    const {
        maxSize = 100,
        ttl = null,
        keyGenerator = JSON.stringify
    } = options;
    
    const cache = new Map();
    const pending = new Map();
    
    return async function(...args) {
        const key = keyGenerator(args);
        
        // Перевіряємо кеш
        if (cache.has(key)) {
            const cached = cache.get(key);
            
            if (ttl && Date.now() - cached.timestamp > ttl) {
                cache.delete(key);
            } else {
                return cached.value;
            }
        }
        
        // Перевіряємо чи вже виконується
        if (pending.has(key)) {
            return pending.get(key);
        }
        
        // Виконуємо функцію
        const promise = fn.apply(this, args);
        pending.set(key, promise);
        
        try {
            const result = await promise;
            
            // Зберігаємо результат
            if (cache.size >= maxSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            
            cache.set(key, {
                value: result,
                timestamp: Date.now()
            });
            
            pending.delete(key);
            return result;
        } catch (error) {
            pending.delete(key);
            throw error;
        }
    };
}

/**
 * Мемоізує обчислення з залежностями
 * @param {Function} computeFn - Функція обчислення
 * @param {Function} depsFn - Функція залежностей
 * @returns {Function} Мемоізована функція
 */
export function memoizeWithDeps(computeFn, depsFn) {
    let lastDeps = null;
    let lastResult = null;
    
    return function(...args) {
        const deps = depsFn(...args);
        
        if (lastDeps && JSON.stringify(deps) === JSON.stringify(lastDeps)) {
            return lastResult;
        }
        
        lastDeps = deps;
        lastResult = computeFn(...args);
        
        return lastResult;
    };
}

/**
 * LRU кеш
 */
export class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    
    get(key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return undefined;
    }
    
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, value);
    }
    
    clear() {
        this.cache.clear();
    }
    
    get size() {
        return this.cache.size;
    }
}
```

## 📊 План реалізації

### Тиждень 1-2: Підготовка
- [ ] Налаштування середовища розробки
- [ ] Створення структури тестів
- [ ] Налаштування CI/CD

### Тиждень 3-4: JSDoc документація
- [ ] Документування State Manager
- [ ] Документування компонентів
- [ ] Документування утиліт

### Тиждень 5-6: TypeScript definitions
- [ ] Створення типів для State Manager
- [ ] Створення типів для компонентів
- [ ] Створення типів для подій

### Тиждень 7-8: Event System
- [ ] Реалізація Event Bus
- [ ] Інтеграція з State Manager
- [ ] Middleware для логування

### Тиждень 9-10: Unit тести
- [ ] Тести для State Manager
- [ ] Тести для компонентів
- [ ] Тести для утиліт

### Тиждень 11-12: Integration тести
- [ ] Тести навігації
- [ ] Тести зміни стану
- [ ] Тести ігрової логіки

### Тиждень 13-14: E2E тести
- [ ] Тести основних сценаріїв
- [ ] Тести онлайн гри
- [ ] Тести продуктивності

### Тиждень 15-16: Кешування
- [ ] DOM кеш
- [ ] Мемоізація
- [ ] Оптимізація продуктивності

## 🎯 Очікувані результати

Після реалізації цих покращень:

1. **Якість коду** покращиться завдяки типізації та документації
2. **Стабільність** зросте завдяки тестуванню
3. **Продуктивність** покращиться завдяки кешуванню
4. **Розширюваність** зросте завдяки системі подій
5. **Підтримуваність** покращиться завдяки логуванню та дебагу

Це дозволить легко додавати нові функції, підтримувати код та забезпечити довгострокову стабільність проекту. 