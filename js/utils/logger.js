/**
 * Централізована система логування
 * @class Logger
 */
class Logger {
    static levels = { 
        ERROR: 0, 
        WARN: 1, 
        INFO: 2, 
        DEBUG: 3 
    };
    
    static config = {
        level: 'INFO',
        maxLogs: 1000,
        persistToStorage: true,
        sendToServer: false,
        showTimestamp: true,
        showLevel: true,
        groupByContext: true,
        // Нові налаштування для оптимізації
        enableConsoleOutput: true,
        enableStorageOutput: true,
        enableServerOutput: false,
        // Умовне логування для різних середовищ
        isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        isProduction: window.location.protocol === 'https:' && !window.location.hostname.includes('localhost'),
        // Швидке вимкнення для тестування
        quickDisable: false
    };
    
    static logs = [];
    static contexts = new Map();
    
    /**
     * Логує повідомлення
     * @param {string} level - Рівень логування
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст логування
     */
    static log(level, message, data = {}, context = '') {
        // Швидке вимкнення для тестування
        if (this.config.quickDisable) {
            return;
        }
        
        // Автоматичне налаштування рівня для продакшену
        if (this.config.isProduction && this.config.level === 'INFO') {
            this.config.level = 'WARN';
        }
        
        if (this.levels[level] > this.levels[this.config.level]) {
            return;
        }
        
        const logEntry = {
            level,
            message,
            data,
            context,
            timestamp: new Date().toISOString(),
            id: this.generateLogId(),
            stack: this.getStackTrace()
        };
        
        this.logs.push(logEntry);
        
        // Обмежуємо кількість логів
        if (this.logs.length > this.config.maxLogs) {
            this.logs.shift();
        }
        
        // Групуємо по контексту
        if (this.config.groupByContext && context) {
            if (!this.contexts.has(context)) {
                this.contexts.set(context, []);
            }
            this.contexts.get(context).push(logEntry);
        }
        
        // Умовне виведення в консоль
        if (this.config.enableConsoleOutput) {
            this.outputToConsole(logEntry);
        }
        
        // Умовне збереження в localStorage
        if (this.config.enableStorageOutput && this.config.persistToStorage) {
            this.saveToStorage(logEntry);
        }
        
        // Умовна відправка на сервер
        if (this.config.enableServerOutput && this.config.sendToServer) {
            this.sendToServer(logEntry);
        }
    }
    
    /**
     * Логує помилку
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     */
    static error(message, data = {}, context = '') {
        this.log('ERROR', message, data, context);
    }
    
    /**
     * Логує попередження
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     */
    static warn(message, data = {}, context = '') {
        this.log('WARN', message, data, context);
    }
    
    /**
     * Логує інформацію
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     */
    static info(message, data = {}, context = '') {
        this.log('INFO', message, data, context);
    }
    
    /**
     * Логує дебаг інформацію (тільки в режимі розробки)
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     */
    static debug(message, data = {}, context = '') {
        // DEBUG логи тільки в режимі розробки
        if (!this.config.isDevelopment && !this.config.isProduction) {
            return;
        }
        this.log('DEBUG', message, data, context);
    }
    
    /**
     * Логує початок операції
     * @param {string} operation - Назва операції
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     */
    static start(operation, data = {}, context = '') {
        const startTime = Date.now();
        this.log('INFO', `Started: ${operation}`, { ...data, startTime }, context);
        return startTime;
    }
    
    /**
     * Логує завершення операції
     * @param {string} operation - Назва операції
     * @param {number} startTime - Час початку
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     */
    static end(operation, startTime, data = {}, context = '') {
        const duration = Date.now() - startTime;
        this.log('INFO', `Completed: ${operation}`, { ...data, duration }, context);
    }
    
    /**
     * Логує вимірювання продуктивності
     * @param {string} name - Назва вимірювання
     * @param {Function} fn - Функція для вимірювання
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     * @returns {*} Результат функції
     */
    static measure(name, fn, data = {}, context = '') {
        const startTime = this.start(name, data, context);
        try {
            const result = fn();
            this.end(name, startTime, { success: true }, context);
            return result;
        } catch (error) {
            this.end(name, startTime, { success: false, error: error.message }, context);
            throw error;
        }
    }
    
    /**
     * Виводить лог в консоль
     * @param {Object} logEntry - Запис логу
     */
    static outputToConsole(logEntry) {
        const { level, message, data, context, timestamp } = logEntry;
        
        let output = '';
        
        if (this.config.showTimestamp) {
            output += `[${new Date(timestamp).toLocaleTimeString()}] `;
        }
        
        if (this.config.showLevel) {
            output += `[${level}] `;
        }
        
        if (context) {
            output += `[${context}] `;
        }
        
        output += message;
        
        const consoleMethod = this.getConsoleMethod(level);
        
        if (Object.keys(data).length > 0) {
            consoleMethod(output, data);
        } else {
            consoleMethod(output);
        }
    }
    
    /**
     * Отримує метод консолі для рівня логування
     * @param {string} level - Рівень логування
     * @returns {Function} Метод консолі
     */
    static getConsoleMethod(level) {
        switch (level) {
            case 'ERROR': return console.error;
            case 'WARN': return console.warn;
            case 'INFO': return console.info;
            case 'DEBUG': return console.debug;
            default: return console.log;
        }
    }
    
    /**
     * Зберігає лог в localStorage
     * @param {Object} logEntry - Запис логу
     */
    static saveToStorage(logEntry) {
        try {
            const storageKey = 'app_logs';
            const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            existingLogs.push(logEntry);
            
            // Обмежуємо розмір в localStorage
            if (existingLogs.length > this.config.maxLogs) {
                existingLogs.splice(0, existingLogs.length - this.config.maxLogs);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(existingLogs));
        } catch (error) {
            console.error('Failed to save log to storage:', error);
        }
    }
    
    /**
     * Відправляє лог на сервер
     * @param {Object} logEntry - Запис логу
     */
    static sendToServer(logEntry) {
        // Реалізація відправки на сервер
        if (this.config.serverUrl) {
            fetch(this.config.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry)
            }).catch(error => {
                console.error('Failed to send log to server:', error);
            });
        }
    }
    
    /**
     * Отримує логи з localStorage
     * @returns {Array<Object>} Масив логів
     */
    static getStoredLogs() {
        try {
            const storageKey = 'app_logs';
            return JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch (error) {
            console.error('Failed to get stored logs:', error);
            return [];
        }
    }
    
    /**
     * Очищує логи з localStorage
     */
    static clearStoredLogs() {
        try {
            const storageKey = 'app_logs';
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Failed to clear stored logs:', error);
        }
    }
    
    /**
     * Отримує статистику логів
     * @returns {Object} Статистика
     */
    static getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byContext: {},
            recent: this.logs.slice(-10),
            config: { ...this.config }
        };
        
        // Підрахунок по рівнях
        this.logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            if (log.context) {
                stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
            }
        });
        
        return stats;
    }
    
    /**
     * Фільтрує логи за критеріями
     * @param {Object} filters - Критерії фільтрації
     * @returns {Array<Object>} Відфільтровані логи
     */
    static filter(filters = {}) {
        let filtered = [...this.logs];
        
        if (filters.level) {
            filtered = filtered.filter(log => log.level === filters.level);
        }
        
        if (filters.context) {
            filtered = filtered.filter(log => log.context === filters.context);
        }
        
        if (filters.message) {
            filtered = filtered.filter(log => 
                log.message.toLowerCase().includes(filters.message.toLowerCase())
            );
        }
        
        if (filters.from) {
            filtered = filtered.filter(log => new Date(log.timestamp) >= filters.from);
        }
        
        if (filters.to) {
            filtered = filtered.filter(log => new Date(log.timestamp) <= filters.to);
        }
        
        return filtered;
    }
    
    /**
     * Генерує унікальний ID для логу
     * @returns {string} ID
     */
    static generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Отримує стек викликів
     * @returns {string} Стек
     */
    static getStackTrace() {
        try {
            throw new Error();
        } catch (error) {
            return error.stack;
        }
    }
    
    /**
     * Налаштовує логер
     * @param {Object} config - Нова конфігурація
     */
    static configure(config) {
        Object.assign(this.config, config);
    }
    
    /**
     * Очищує всі логи
     */
    static clear() {
        this.logs = [];
        this.contexts.clear();
    }
    
    /**
     * Швидке вимкнення логування для тестування
     */
    static disable() {
        this.config.quickDisable = true;
    }
    
    /**
     * Швидке включення логування
     */
    static enable() {
        this.config.quickDisable = false;
    }
    
    /**
     * Встановлює режим продакшену (мінімальне логування)
     */
    static setProductionMode() {
        this.configure({
            level: 'WARN',
            enableConsoleOutput: true,
            enableStorageOutput: false,
            enableServerOutput: false,
            showTimestamp: false,
            showLevel: true,
            groupByContext: false
        });
    }
    
    /**
     * Встановлює режим розробки (максимальне логування)
     */
    static setDevelopmentMode() {
        this.configure({
            level: 'DEBUG',
            enableConsoleOutput: true,
            enableStorageOutput: true,
            enableServerOutput: false,
            showTimestamp: true,
            showLevel: true,
            groupByContext: true
        });
    }
}

// Автоматичне налаштування режиму при ініціалізації
if (Logger.config.isProduction) {
    Logger.setProductionMode();
} else if (Logger.config.isDevelopment) {
    Logger.setDevelopmentMode();
}

// Додаємо логування виправлень багів
Logger.info('🔧 Bug fixes applied:', {
    bug12: 'Blocked cells mode now properly displays blocked cells with red ✗ symbol',
    bug13: 'Default distance now correctly resets to 1 when changing board size',
    bug15: 'MainMenuComponent bindEvents now prevents duplicate event listeners',
    bug17: 'GameControlsComponent render now prevents duplicate rendering'
});

// Експорт для використання
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
} else {
    window.Logger = Logger;
} 

export { Logger };

export default Logger; 