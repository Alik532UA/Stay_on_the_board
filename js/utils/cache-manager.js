/**
 * Кеш для DOM-елементів з автоматичним очищенням
 * @class DOMCache
 */
class DOMCache {
    constructor(options = {}) {
        const {
            maxSize = 100,
            ttl = 5 * 60 * 1000, // 5 хвилин
            autoCleanup = true,
            cleanupInterval = 60 * 1000 // 1 хвилина
        } = options;
        
        /** @type {Map<string, {element: Element, timestamp: number, hits: number}>} */
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.autoCleanup = autoCleanup;
        this.cleanupInterval = cleanupInterval;
        this.hits = 0;
        this.misses = 0;
        this.cleanupTimer = null;
        
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
            
            // Перевіряємо TTL
            if (Date.now() - cached.timestamp > this.ttl) {
                this.cache.delete(key);
                this.misses++;
            } else if (this.isElementValid(cached.element)) {
                cached.hits++;
                this.hits++;
                return cached.element;
            } else {
                this.cache.delete(key);
                this.misses++;
            }
        } else {
            this.misses++;
        }
        
        // Шукаємо в DOM
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
        const key = this.getCacheKey(selector, context, 'all');
        
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            
            if (Date.now() - cached.timestamp > this.ttl) {
                this.cache.delete(key);
                this.misses++;
            } else if (this.areElementsValid(cached.elements)) {
                cached.hits++;
                this.hits++;
                return cached.elements;
            } else {
                this.cache.delete(key);
                this.misses++;
            }
        } else {
            this.misses++;
        }
        
        // Шукаємо в DOM
        const elements = context.querySelectorAll(selector);
        if (elements.length > 0) {
            this.set(key, elements, true);
        }
        
        return elements;
    }
    
    /**
     * Додає елемент в кеш
     * @param {string} key - Ключ кешу
     * @param {Element|NodeList} element - DOM елемент або список
     * @param {boolean} [isNodeList] - Чи це NodeList
     */
    set(key, element, isNodeList = false) {
        // Перевіряємо розмір кешу
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        
        this.cache.set(key, {
            element: isNodeList ? element : element,
            elements: isNodeList ? element : null,
            timestamp: Date.now(),
            hits: 0
        });
    }
    
    /**
     * Видаляє елемент з кешу
     * @param {string} selector - CSS селектор
     * @param {Element} [context] - Контекст пошуку
     */
    delete(selector, context = document) {
        const key = this.getCacheKey(selector, context);
        this.cache.delete(key);
    }
    
    /**
     * Очищує весь кеш
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
    
    /**
     * Очищує застарілі елементи
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        
        for (const [key, cached] of this.cache) {
            if (now - cached.timestamp > this.ttl) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
        
        if (keysToDelete.length > 0) {
            Logger.error(`DOMCache: Cleaned up ${keysToDelete.length} expired entries`);
        }
    }
    
    /**
     * Запускає автоматичне очищення
     */
    startAutoCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }
    
    /**
     * Зупиняє автоматичне очищення
     */
    stopAutoCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
    
    /**
     * Видаляє найстаріший елемент з кешу
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, cached] of this.cache) {
            if (cached.timestamp < oldestTime) {
                oldestTime = cached.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
    
    /**
     * Генерує ключ кешу
     * @param {string} selector - CSS селектор
     * @param {Element} context - Контекст пошуку
     * @param {string} [suffix] - Додатковий суфікс
     * @returns {string} Ключ кешу
     */
    getCacheKey(selector, context, suffix = '') {
        const contextId = context === document ? 'doc' : context.id || context.className || 'unknown';
        return `${selector}_${contextId}_${suffix}`;
    }
    
    /**
     * Перевіряє чи елемент все ще існує в DOM
     * @param {Element} element - DOM елемент
     * @returns {boolean} Чи елемент валідний
     */
    isElementValid(element) {
        return element && document.contains(element);
    }
    
    /**
     * Перевіряє чи елементи все ще існують в DOM
     * @param {NodeList} elements - Список DOM елементів
     * @returns {boolean} Чи елементи валідні
     */
    areElementsValid(elements) {
        if (!elements || elements.length === 0) return false;
        
        for (let i = 0; i < elements.length; i++) {
            if (!this.isElementValid(elements[i])) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Отримує статистику кешу
     * @returns {Object} Статистика
     */
    getStats() {
        const totalRequests = this.hits + this.misses;
        const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
        
        // Знаходимо найпопулярніші елементи
        const popularElements = Array.from(this.cache.entries())
            .sort((a, b) => b[1].hits - a[1].hits)
            .slice(0, 5)
            .map(([key, cached]) => ({
                key,
                hits: cached.hits,
                age: Date.now() - cached.timestamp
            }));
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: Math.round(hitRate * 100) / 100,
            ttl: this.ttl,
            popularElements
        };
    }
    
    /**
     * Отримує розмір кешу в байтах (приблизно)
     * @returns {number} Розмір в байтах
     */
    getSize() {
        let size = 0;
        
        for (const [key, cached] of this.cache) {
            size += key.length * 2; // UTF-16
            size += 24; // timestamp + hits
            if (cached.element) {
                size += cached.element.outerHTML ? cached.element.outerHTML.length * 2 : 100;
            }
        }
        
        return size;
    }
    
    /**
     * Знищує кеш
     */
    destroy() {
        this.stopAutoCleanup();
        this.clear();
    }
}

// Створюємо глобальний екземпляр DOMCache
window.domCache = new DOMCache();

// Експорт для використання в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMCache;
} 