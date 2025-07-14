/**
 * Централізована система подій для зв'язку між компонентами
 * @class EventBus
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.middleware = [];
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.isDestroyed = false;
    }

    emit(event, data = {}) {
        if (this.isDestroyed) return false;

        const eventData = { event, data, timestamp: Date.now(), id: this.generateEventId() };
        
        // Застосовуємо middleware
        let processedData = this.applyMiddleware(eventData);
        if (processedData === null) return false;

        this.saveToHistory(eventData);

        const handlers = this.listeners.get(event) || [];
        handlers.forEach(handler => {
            try {
                handler(processedData.data, processedData);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
        
        return handlers.length > 0;
    }

    on(event, handler) {
        if (this.isDestroyed) return () => {};
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
        return () => this.off(event, handler);
    }

    off(event, handler) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
            if (handlers.length === 0) {
                this.listeners.delete(event);
            }
        }
    }
    
    use(middleware) {
        this.middleware.push(middleware);
    }

    applyMiddleware(eventData) {
        let processedData = eventData;
        for (const mw of this.middleware) {
            processedData = mw(processedData);
            if (processedData === null) return null;
        }
        return processedData;
    }

    saveToHistory(eventData) {
        this.eventHistory.push(eventData);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    destroy() {
        this.isDestroyed = true;
        this.listeners.clear();
        this.middleware = [];
        this.eventHistory = [];
    }
}

// Створюємо та експортуємо єдиний екземпляр EventBus
export const eventBus = new EventBus();

// Додаємо як глобальний об'єкт для сумісності
if (typeof window !== 'undefined') {
    window.eventBus = eventBus;
} 