# 🏗️ Нова архітектура "Stay on the board"

## 🎯 Мета

Цей документ описує нову архітектуру проекту "Stay on the board", яка була розроблена для підвищення стабільності, масштабованості та легкості підтримки програми.

## 📋 Що було реалізовано

### ✅ Системи архітектури

1. **EventBus** - Централізована система подій
2. **Logger** - Система логування та моніторингу
3. **DOMCache** - Кешування DOM елементів
4. **TestRunner** - Система unit тестування
5. **Types** - Типізація та інтерфейси

### 📁 Структура файлів

```
Stay_on_the_board/
├── js/
│   ├── event-bus.js              # Система подій
│   ├── types.js                  # Типи та інтерфейси
│   ├── utils/
│   │   ├── logger.js             # Система логування
│   │   ├── cache-manager.js      # Кешування DOM
│   │   └── test-runner.js        # Тест-ранер
│   └── components/               # Компоненти (існуючі)
├── tests/
│   └── unit/                     # Unit тести
│       ├── state-manager.test.js
│       ├── event-bus.test.js
│       ├── logger.test.js
│       └── dom-cache.test.js
├── docs/                         # Документація
├── test-runner.html              # Тест-ранер UI
└── index.html                    # Головна сторінка
```

## 🚀 Швидкий старт

### 1. Запуск програми

```bash
# Відкрийте index.html в браузері
open index.html
```

### 2. Запуск тестів

```bash
# Відкрийте test-runner.html в браузері
open test-runner.html
```

### 3. Використання нових систем

```javascript
// EventBus - система подій
eventBus.on('game:start', (data) => {
    console.log('Гра розпочата:', data);
});

eventBus.emit('game:start', { player: 'user1' });

// Logger - система логування
Logger.info('Додаток запущено', { version: '1.0.0' });
Logger.error('Помилка', { error: 'Something went wrong' });

// DOMCache - кешування DOM
const button = domCache.get('#start-btn');
const cells = domCache.getAll('.game-cell');
```

## 📚 Детальна документація

### EventBus - Система подій

**Призначення:** Централізована система для зв'язку між компонентами.

**Основні методи:**
- `eventBus.emit(event, data)` - відправка події
- `eventBus.on(event, handler)` - підписка на подію
- `eventBus.off(event, handler)` - відписка від події
- `eventBus.once(event, handler)` - одноразова підписка
- `eventBus.use(middleware)` - додавання middleware

**Приклад:**
```javascript
// Підписка на подію
const unsubscribe = eventBus.on('user:login', (userData) => {
    updateUI(userData);
    Logger.info('Користувач увійшов', userData);
});

// Відправка події
eventBus.emit('user:login', {
    id: 1,
    name: 'John',
    email: 'john@example.com'
});

// Middleware для логування
eventBus.use((eventData) => {
    Logger.debug(`Подія: ${eventData.event}`, eventData.data);
});
```

### Logger - Система логування

**Призначення:** Централізоване логування для дебагу та моніторингу.

**Рівні логування:**
- `Logger.error()` - Помилки
- `Logger.warn()` - Попередження
- `Logger.info()` - Інформація
- `Logger.debug()` - Дебаг

**Основні методи:**
- `Logger.log(level, message, data, context)` - базове логування
- `Logger.measure(name, fn, data, context)` - вимірювання продуктивності
- `Logger.getStats()` - статистика логів
- `Logger.filter(filters)` - фільтрація логів

**Приклад:**
```javascript
// Базове логування
Logger.info('Гра розпочата', { 
    player: 'user1', 
    boardSize: 5 
}, 'game');

// Вимірювання продуктивності
const result = Logger.measure('board-update', () => {
    return updateGameBoard();
}, { boardSize: 5 });

// Статистика
const stats = Logger.getStats();
console.log('Логи по рівнях:', stats.byLevel);
```

### DOMCache - Кешування DOM

**Призначення:** Оптимізація продуктивності через кешування DOM елементів.

**Основні методи:**
- `domCache.get(selector, context)` - отримання елемента
- `domCache.getAll(selector, context)` - отримання всіх елементів
- `domCache.set(key, element)` - додавання в кеш
- `domCache.delete(selector, context)` - видалення з кешу
- `domCache.getStats()` - статистика кешу

**Приклад:**
```javascript
// Отримання елемента з кешу або DOM
const startButton = domCache.get('#start-game-btn');
const gameCells = domCache.getAll('.game-cell');

// Статистика кешу
const stats = domCache.getStats();
console.log('Hit rate:', stats.hitRate + '%');

// Очищення кешу
domCache.clear();
```

### TestRunner - Система тестування

**Призначення:** Unit тестування компонентів та функцій.

**Основні функції:**
- `describe(name, fn)` - група тестів
- `it(name, fn)` - окремий тест
- `expect(value)` - перевірки
- `beforeEach(fn)` - налаштування перед тестом
- `afterEach(fn)` - очищення після тесту

**Приклад:**
```javascript
describe('StateManager', () => {
    let stateManager;
    
    beforeEach(() => {
        stateManager = new StateManager();
    });
    
    it('повинен створити StateManager', () => {
        expect(stateManager).toBeDefined();
        expect(stateManager.state).toBeDefined();
    });
    
    it('повинен встановити значення', () => {
        const result = stateManager.setState('settings.language', 'en');
        expect(result).toBe(true);
        expect(stateManager.getState('settings.language')).toBe('en');
    });
});
```

### Types - Типізація

**Призначення:** Визначення типів та інтерфейсів для кращої типобезпеки.

**Основні типи:**
- `AppState` - загальний стан додатку
- `GameState` - стан гри
- `SettingsState` - налаштування
- `UIState` - UI стан

**Константи:**
- `GameModes` - режими гри
- `Views` - екрани додатку
- `Languages` - підтримувані мови
- `Themes` - теми інтерфейсу

**Приклад:**
```javascript
/**
 * @param {GameState} gameState - Стан гри
 * @returns {boolean} Чи можна зробити хід
 */
function canMakeMove(gameState) {
    return gameState.isActive && gameState.availableMoves.length > 0;
}

// Використання констант
if (currentView === Views.GAME) {
    // Логіка для ігрового екрану
}
```

## 🔧 Інтеграція з існуючим кодом

### Оновлення компонентів

Для використання нових систем в існуючих компонентах:

```javascript
class MyComponent extends BaseComponent {
    constructor(options) {
        super(options);
        
        // Автоматично доступні:
        // this.eventBus - система подій
        // this.logger - система логування
        // this.domCache - кешування DOM
    }
    
    render() {
        this.logger.start('component-render');
        
        try {
            // Використовуємо кеш для DOM елементів
            const container = this.domCache.get(this.options.container);
            
            // Логіка рендерингу...
            
            // Відправляємо подію
            this.eventBus.emit('component:rendered', {
                component: this.constructor.name
            });
            
        } catch (error) {
            this.logger.error('Помилка рендерингу', { error: error.message });
            throw error;
        }
    }
}
```

### Оновлення StateManager

StateManager автоматично інтегрований з новими системами:

```javascript
// Автоматично логує зміни стану
stateManager.setState('game.points', 100);

// Автоматично відправляє події
eventBus.on('state:changed', (data) => {
    console.log('Стан змінився:', data);
});
```

## 📊 Моніторинг та дебаг

### Перегляд логів

```javascript
// В консолі браузера
Logger.getStats(); // Статистика логів
Logger.filter({ level: 'ERROR' }); // Фільтрація помилок
Logger.getStoredLogs(); // Логи з localStorage
```

### Перегляд подій

```javascript
// В консолі браузера
eventBus.getHistory(); // Історія подій
eventBus.getEvents(); // Список всіх подій
eventBus.getListenerCount('game:move'); // Кількість підписників
```

### Перегляд кешу

```javascript
// В консолі браузера
domCache.getStats(); // Статистика кешу
domCache.getSize(); // Розмір кешу в байтах
```

## 🧪 Тестування

### Запуск всіх тестів

1. Відкрийте `test-runner.html` в браузері
2. Натисніть "Запустити всі тести"
3. Перегляньте результати

### Запуск окремих тестів

```javascript
// В консолі браузера
const testRunner = new TestRunner();
testRunner.run().then(summary => {
    console.log('Результати тестів:', summary);
});
```

### Створення нових тестів

```javascript
// Створіть файл tests/unit/my-component.test.js
describe('MyComponent', () => {
    it('повинен працювати правильно', () => {
        // Ваші тести
    });
});
```

## 🚀 Наступні кроки

### Для розробників

1. **Вивчіть документацію** - прочитайте всі файли в папці `docs/`
2. **Запустіть тести** - переконайтеся що все працює
3. **Інтегруйте в код** - використовуйте нові системи в компонентах
4. **Додайте тести** - створіть тести для нових функцій

### Для архітекторів

1. **Проаналізуйте метрики** - використовуйте Logger для збору даних
2. **Оптимізуйте продуктивність** - використовуйте DOMCache ефективно
3. **Розширюйте функціональність** - додавайте нові події та логі
4. **Покращуйте тестування** - збільшуйте покриття тестами

## 📞 Підтримка

### Корисні команди

```javascript
// В консолі браузера

// Очищення всіх систем
Logger.clear();
eventBus.clear();
domCache.clear();

// Перевірка стану систем
console.log('Logger stats:', Logger.getStats());
console.log('EventBus events:', eventBus.getEvents());
console.log('DOMCache stats:', domCache.getStats());

// Налаштування логування
Logger.configure({ level: 'DEBUG' });
```

### Відомі проблеми

1. **EventBus** - події не очищуються автоматично при знищенні компонентів
2. **DOMCache** - кеш може містити застарілі елементи після зміни DOM
3. **Logger** - велика кількість логів може вплинути на продуктивність

### Рішення проблем

1. **Завжди відписуйтеся** від подій при знищенні компонентів
2. **Очищуйте кеш** при значних змінах DOM
3. **Налаштуйте рівень логування** для продакшену

## 📝 Висновки

Нова архітектура забезпечує:

- ✅ **Стабільність** - централізоване логування та обробка помилок
- ✅ **Масштабованість** - модульна архітектура з чіткими інтерфейсами  
- ✅ **Підтримка** - детальна документація та тестування
- ✅ **Продуктивність** - оптимізація через кешування та події

Це міцна основа для подальшого розвитку проекту! 