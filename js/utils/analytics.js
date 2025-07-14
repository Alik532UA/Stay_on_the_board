/**
 * Система аналітики для збору метрик використання додатку
 * @class Analytics
 */
class Analytics {
    constructor(options = {}) {
        const {
            enabled = true,
            sessionId = null,
            userId = null,
            endpoint = null,
            batchSize = 10,
            flushInterval = 30000, // 30 секунд
            maxEvents = 1000
        } = options;
        
        this.enabled = enabled;
        this.sessionId = sessionId || this.generateSessionId();
        this.userId = userId || this.getUserId();
        this.endpoint = endpoint;
        this.batchSize = batchSize;
        this.flushInterval = flushInterval;
        this.maxEvents = maxEvents;
        
        this.events = [];
        this.flushTimer = null;
        this.isDestroyed = false;
        
        // Ініціалізація
        if (this.enabled) {
            this.init();
        }
    }
    
    /**
     * Ініціалізує систему аналітики
     */
    init() {
        if (this.isDestroyed) return;
        
        // Запускаємо автоматичне відправлення
        this.startAutoFlush();
        
        // Відстежуємо початкові метрики
        this.trackPageView();
        this.trackUserAgent();
        this.trackScreenSize();
        
        // Відстежуємо події браузера
        this.trackBrowserEvents();
        
        Logger.info('📊 Analytics initialized');
    }
    
    /**
     * Відстежує подію
     * @param {string} event - Назва події
     * @param {Object} data - Дані події
     * @param {Object} options - Додаткові опції
     */
    track(event, data = {}, options = {}) {
        if (!this.enabled || this.isDestroyed) return;
        
        const eventData = {
            event,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            ...options
        };
        
        this.events.push(eventData);
        
        // Обмежуємо кількість подій
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        
        // Відправляємо якщо досягли ліміту
        if (this.events.length >= this.batchSize) {
            this.flush();
        }
        
        // Логуємо в режимі розробки
        if (process.env.NODE_ENV === 'development') {
            Logger.debug('Analytics:', event, data);
        }
    }
    
    /**
     * Відстежує перегляд сторінки
     */
    trackPageView() {
        this.track('page_view', {
            title: document.title,
            referrer: document.referrer
        });
    }
    
    /**
     * Відстежує клік
     * @param {string} element - Елемент
     * @param {Object} data - Додаткові дані
     */
    trackClick(element, data = {}) {
        this.track('click', {
            element,
            ...data
        });
    }
    
    /**
     * Відстежує дію користувача
     * @param {string} action - Дія
     * @param {Object} data - Додаткові дані
     */
    trackAction(action, data = {}) {
        this.track('action', {
            action,
            ...data
        });
    }
    
    /**
     * Відстежує помилку
     * @param {string} error - Помилка
     * @param {Object} data - Додаткові дані
     */
    trackError(error, data = {}) {
        this.track('error', {
            error: error.message || error,
            stack: error.stack,
            ...data
        });
    }
    
    /**
     * Відстежує продуктивність
     * @param {string} metric - Метрика
     * @param {number} value - Значення
     * @param {Object} data - Додаткові дані
     */
    trackPerformance(metric, value, data = {}) {
        this.track('performance', {
            metric,
            value,
            ...data
        });
    }
    
    /**
     * Відстежує ігрову подію
     * @param {string} gameEvent - Ігрова подія
     * @param {Object} data - Додаткові дані
     */
    trackGameEvent(gameEvent, data = {}) {
        this.track('game_event', {
            gameEvent,
            ...data
        });
    }
    
    /**
     * Відстежує налаштування
     * @param {string} setting - Налаштування
     * @param {*} value - Значення
     */
    trackSetting(setting, value) {
        this.track('setting_change', {
            setting,
            value
        });
    }
    
    /**
     * Відстежує User Agent
     */
    trackUserAgent() {
        this.track('user_agent', {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        });
    }
    
    /**
     * Відстежує розмір екрану
     */
    trackScreenSize() {
        this.track('screen_size', {
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }
    
    /**
     * Відстежує події браузера
     */
    trackBrowserEvents() {
        // Відстежуємо зміну розміру вікна
        window.addEventListener('resize', () => {
            this.trackScreenSize();
        });
        
        // Відстежуємо видимість сторінки
        document.addEventListener('visibilitychange', () => {
            this.track('visibility_change', {
                visible: !document.hidden
            });
        });
        
        // Відстежуємо онлайн/офлайн статус
        window.addEventListener('online', () => {
            this.track('connection_change', { online: true });
        });
        
        window.addEventListener('offline', () => {
            this.track('connection_change', { online: false });
        });
    }
    
    /**
     * Відправляє події на сервер
     */
    async flush() {
        if (this.events.length === 0 || !this.endpoint) return;
        
        const eventsToSend = this.events.splice(0, this.batchSize);
        
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    userId: this.userId,
                    events: eventsToSend
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            Logger.debug(`Analytics: Sent ${eventsToSend.length} events`);
            
        } catch (error) {
            Logger.error('Analytics flush error:', error);
            
            // Повертаємо події назад в чергу
            this.events.unshift(...eventsToSend);
        }
    }
    
    /**
     * Запускає автоматичне відправлення
     */
    startAutoFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }
    
    /**
     * Зупиняє автоматичне відправлення
     */
    stopAutoFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }
    
    /**
     * Отримує статистику
     * @returns {Object} Статистика
     */
    getStats() {
        const eventTypes = {};
        const sessionDuration = Date.now() - this.sessionStartTime;
        
        this.events.forEach(event => {
            eventTypes[event.event] = (eventTypes[event.event] || 0) + 1;
        });
        
        return {
            totalEvents: this.events.length,
            sessionDuration,
            eventTypes,
            sessionId: this.sessionId,
            userId: this.userId
        };
    }
    
    /**
     * Експортує дані
     * @returns {Object} Дані для експорту
     */
    export() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            events: [...this.events],
            stats: this.getStats()
        };
    }
    
    /**
     * Очищує дані
     */
    clear() {
        this.events = [];
    }
    
    /**
     * Генерує ID сесії
     * @returns {string} ID сесії
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Отримує ID користувача
     * @returns {string} ID користувача
     */
    getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }
    
    /**
     * Знищує екземпляр
     */
    destroy() {
        this.isDestroyed = true;
        this.stopAutoFlush();
        this.flush();
        this.clear();
    }
}

// Глобальний екземпляр
window.analytics = new Analytics({
    enabled: process.env.NODE_ENV === 'development' || true,
    endpoint: process.env.ANALYTICS_ENDPOINT || null
});

// Експорт для модулів
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
} 