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
        groupByContext: true
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
        
        this.outputToConsole(logEntry);
        
        if (this.config.persistToStorage) {
            this.saveToStorage(logEntry);
        }
        
        if (this.config.sendToServer) {
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
     * Логує дебаг інформацію
     * @param {string} message - Повідомлення
     * @param {Object} data - Додаткові дані
     * @param {string} context - Контекст
     */
    static debug(message, data = {}, context = '') {
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
        // Тут можна реалізувати відправку на сервер
        // Наприклад, через fetch або WebSocket
        if (window.eventBus) {
            window.eventBus.emit('log:server', logEntry);
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
     * Очищує логи в localStorage
     */
    static clearStoredLogs() {
        try {
            localStorage.removeItem('app_logs');
        } catch (error) {
            console.error('Failed to clear stored logs:', error);
        }
    }
    
    /**
     * Отримує статистику логування
     * @returns {Object} Статистика
     */
    static getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byContext: {},
            recent: this.logs.slice(-10)
        };
        
        // Підрахунок по рівнях
        for (const level of Object.keys(this.levels)) {
            stats.byLevel[level] = this.logs.filter(log => log.level === level).length;
        }
        
        // Підрахунок по контекстах
        for (const [context, logs] of this.contexts) {
            stats.byContext[context] = logs.length;
        }
        
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
     * @returns {string} Унікальний ID
     */
    static generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Отримує стек викликів
     * @returns {string} Стек викликів
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
}

// Експорт для використання в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
} else {
    window.Logger = Logger;
} 

export default Logger; 