/**
 * Система мережевих запитів для API та онлайн функціональності
 * @class NetworkManager
 */
class NetworkManager {
    constructor(options = {}) {
        const {
            baseURL = '',
            timeout = 10000,
            retries = 3,
            retryDelay = 1000,
            headers = {},
            withCredentials = false,
            enableCache = true,
            cacheTimeout = 5 * 60 * 1000 // 5 хвилин
        } = options;
        
        this.baseURL = baseURL;
        this.timeout = timeout;
        this.retries = retries;
        this.retryDelay = retryDelay;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        this.withCredentials = withCredentials;
        this.enableCache = enableCache;
        this.cacheTimeout = cacheTimeout;
        
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.requestCount = 0;
        this.isDestroyed = false;
        
        // Middleware для обробки запитів
        this.requestMiddleware = [];
        this.responseMiddleware = [];
        this.errorMiddleware = [];
    }
    
    /**
     * Додає middleware для обробки запитів
     * @param {Function} middleware - Middleware функція
     */
    useRequest(middleware) {
        this.requestMiddleware.push(middleware);
    }
    
    /**
     * Додає middleware для обробки відповідей
     * @param {Function} middleware - Middleware функція
     */
    useResponse(middleware) {
        this.responseMiddleware.push(middleware);
    }
    
    /**
     * Додає middleware для обробки помилок
     * @param {Function} middleware - Middleware функція
     */
    useError(middleware) {
        this.errorMiddleware.push(middleware);
    }
    
    /**
     * Виконує GET запит
     * @param {string} url - URL запиту
     * @param {Object} options - Опції запиту
     * @returns {Promise<Object>} Результат запиту
     */
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    /**
     * Виконує POST запит
     * @param {string} url - URL запиту
     * @param {Object} data - Дані для відправки
     * @param {Object} options - Опції запиту
     * @returns {Promise<Object>} Результат запиту
     */
    async post(url, data = null, options = {}) {
        return this.request(url, { ...options, method: 'POST', data });
    }
    
    /**
     * Виконує PUT запит
     * @param {string} url - URL запиту
     * @param {Object} data - Дані для відправки
     * @param {Object} options - Опції запиту
     * @returns {Promise<Object>} Результат запиту
     */
    async put(url, data = null, options = {}) {
        return this.request(url, { ...options, method: 'PUT', data });
    }
    
    /**
     * Виконує DELETE запит
     * @param {string} url - URL запиту
     * @param {Object} options - Опції запиту
     * @returns {Promise<Object>} Результат запиту
     */
    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
    
    /**
     * Виконує PATCH запит
     * @param {string} url - URL запиту
     * @param {Object} data - Дані для відправки
     * @param {Object} options - Опції запиту
     * @returns {Promise<Object>} Результат запиту
     */
    async patch(url, data = null, options = {}) {
        return this.request(url, { ...options, method: 'PATCH', data });
    }
    
    /**
     * Виконує запит з підтримкою кешування та повторних спроб
     * @param {string} url - URL запиту
     * @param {Object} options - Опції запиту
     * @returns {Promise<Object>} Результат запиту
     */
    async request(url, options = {}) {
        if (this.isDestroyed) {
            throw new Error('NetworkManager is destroyed');
        }
        
        const {
            method = 'GET',
            data = null,
            headers = {},
            timeout = this.timeout,
            retries = this.retries,
            cache = this.enableCache,
            cacheTimeout = this.cacheTimeout,
            skipMiddleware = false
        } = options;
        
        const fullURL = this.buildURL(url);
        const requestId = this.generateRequestId();
        
        // Перевіряємо кеш для GET запитів
        if (cache && method === 'GET') {
            const cachedResponse = this.getCachedResponse(fullURL);
            if (cachedResponse) {
                return cachedResponse;
            }
        }
        
        // Перевіряємо чи є вже такий запит
        if (this.pendingRequests.has(fullURL)) {
            return this.pendingRequests.get(fullURL);
        }
        
        // Створюємо об'єкт запиту
        const requestConfig = {
            url: fullURL,
            method: method.toUpperCase(),
            headers: { ...this.defaultHeaders, ...headers },
            timeout,
            withCredentials: this.withCredentials
        };
        
        // Застосовуємо middleware для запиту
        if (!skipMiddleware) {
            for (const middleware of this.requestMiddleware) {
                try {
                    const result = middleware(requestConfig);
                    if (result) {
                        Object.assign(requestConfig, result);
                    }
                } catch (error) {
                    console.error('Request middleware error:', error);
                }
            }
        }
        
        // Створюємо Promise для запиту
        const requestPromise = this.executeRequest(requestConfig, data, retries);
        
        // Зберігаємо в pending requests
        this.pendingRequests.set(fullURL, requestPromise);
        
        try {
            const response = await requestPromise;
            
            // Застосовуємо middleware для відповіді
            if (!skipMiddleware) {
                for (const middleware of this.responseMiddleware) {
                    try {
                        const result = middleware(response);
                        if (result) {
                            Object.assign(response, result);
                        }
                    } catch (error) {
                        console.error('Response middleware error:', error);
                    }
                }
            }
            
            // Кешуємо GET запити
            if (cache && method === 'GET') {
                this.cacheResponse(fullURL, response, cacheTimeout);
            }
            
            return response;
            
        } finally {
            // Видаляємо з pending requests
            this.pendingRequests.delete(fullURL);
        }
    }
    
    /**
     * Виконує запит з повторними спробами
     * @param {Object} config - Конфігурація запиту
     * @param {Object} data - Дані для відправки
     * @param {number} retries - Кількість повторних спроб
     * @returns {Promise<Object>} Результат запиту
     */
    async executeRequest(config, data, retries) {
        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await this.makeRequest(config, data);
                
                // Логуємо успішний запит
                Logger.info('Network request successful', {
                    url: config.url,
                    method: config.method,
                    status: response.status,
                    attempt: attempt + 1
                });
                
                return response;
                
            } catch (error) {
                lastError = error;
                
                // Логуємо помилку
                Logger.warn('Network request failed', {
                    url: config.url,
                    method: config.method,
                    error: error.message,
                    attempt: attempt + 1,
                    retries: retries
                });
                
                // Застосовуємо middleware для помилок
                for (const middleware of this.errorMiddleware) {
                    try {
                        middleware(error, config, attempt);
                    } catch (middlewareError) {
                        console.error('Error middleware error:', middlewareError);
                    }
                }
                
                // Якщо це остання спроба, кидаємо помилку
                if (attempt === retries) {
                    break;
                }
                
                // Чекаємо перед повторною спробою
                await this.delay(this.retryDelay * Math.pow(2, attempt));
            }
        }
        
        throw lastError;
    }
    
    /**
     * Виконує один запит
     * @param {Object} config - Конфігурація запиту
     * @param {Object} data - Дані для відправки
     * @returns {Promise<Object>} Результат запиту
     */
    async makeRequest(config, data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
            const requestOptions = {
                method: config.method,
                headers: config.headers,
                signal: controller.signal,
                credentials: config.withCredentials ? 'include' : 'same-origin'
            };
            
            // Додаємо тіло запиту для POST, PUT, PATCH
            if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
                if (typeof data === 'object' && !(data instanceof FormData)) {
                    requestOptions.body = JSON.stringify(data);
                } else {
                    requestOptions.body = data;
                    // Видаляємо Content-Type для FormData
                    delete requestOptions.headers['Content-Type'];
                }
            }
            
            const response = await fetch(config.url, requestOptions);
            
            // Перевіряємо статус відповіді
            if (!response.ok) {
                throw new NetworkError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    response.statusText
                );
            }
            
            // Парсимо відповідь
            let responseData;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }
            
            return {
                data: responseData,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url,
                config
            };
            
        } finally {
            clearTimeout(timeoutId);
        }
    }
    
    /**
     * Отримує кешовану відповідь
     * @param {string} url - URL запиту
     * @returns {Object|null} Кешована відповідь
     */
    getCachedResponse(url) {
        if (!this.cache.has(url)) return null;
        
        const cached = this.cache.get(url);
        if (Date.now() - cached.timestamp > cached.timeout) {
            this.cache.delete(url);
            return null;
        }
        
        return cached.response;
    }
    
    /**
     * Кешує відповідь
     * @param {string} url - URL запиту
     * @param {Object} response - Відповідь
     * @param {number} timeout - Час життя кешу
     */
    cacheResponse(url, response, timeout) {
        this.cache.set(url, {
            response,
            timestamp: Date.now(),
            timeout
        });
    }
    
    /**
     * Очищує кеш
     * @param {string} [url] - Конкретний URL для очищення
     */
    clearCache(url = null) {
        if (url) {
            this.cache.delete(url);
        } else {
            this.cache.clear();
        }
    }
    
    /**
     * Створює повний URL
     * @param {string} url - URL запиту
     * @returns {string} Повний URL
     */
    buildURL(url) {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        if (this.baseURL) {
            return `${this.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
        }
        
        return url;
    }
    
    /**
     * Генерує унікальний ID запиту
     * @returns {string} ID запиту
     */
    generateRequestId() {
        return `req_${Date.now()}_${++this.requestCount}`;
    }
    
    /**
     * Затримка виконання
     * @param {number} ms - Мілісекунди
     * @returns {Promise} Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Перевіряє з'єднання з інтернетом
     * @returns {Promise<boolean>} Чи є з'єднання
     */
    async checkConnection() {
        try {
            const response = await fetch('/ping', { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    /**
     * Отримує статистику запитів
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            requestCount: this.requestCount,
            pendingRequests: this.pendingRequests.size,
            cacheSize: this.cache.size,
            baseURL: this.baseURL,
            timeout: this.timeout,
            retries: this.retries
        };
    }
    
    /**
     * Знищує екземпляр
     */
    destroy() {
        this.isDestroyed = true;
        this.cache.clear();
        this.pendingRequests.clear();
    }
}

/**
 * Клас помилки мережі
 */
class NetworkError extends Error {
    constructor(message, status, statusText) {
        super(message);
        this.name = 'NetworkError';
        this.status = status;
        this.statusText = statusText;
    }
}

/**
 * API клієнт для ігрових функцій
 */
class GameAPI {
    constructor(networkManager) {
        this.network = networkManager;
    }
    
    /**
     * Отримує список доступних ігор
     * @returns {Promise<Array>} Список ігор
     */
    async getGames() {
        return this.network.get('/api/games');
    }
    
    /**
     * Створює нову гру
     * @param {Object} gameData - Дані гри
     * @returns {Promise<Object>} Створена гра
     */
    async createGame(gameData) {
        return this.network.post('/api/games', gameData);
    }
    
    /**
     * Приєднується до гри
     * @param {string} gameId - ID гри
     * @param {Object} playerData - Дані гравця
     * @returns {Promise<Object>} Результат приєднання
     */
    async joinGame(gameId, playerData) {
        return this.network.post(`/api/games/${gameId}/join`, playerData);
    }
    
    /**
     * Робить хід
     * @param {string} gameId - ID гри
     * @param {Object} moveData - Дані ходу
     * @returns {Promise<Object>} Результат ходу
     */
    async makeMove(gameId, moveData) {
        return this.network.post(`/api/games/${gameId}/move`, moveData);
    }
    
    /**
     * Отримує стан гри
     * @param {string} gameId - ID гри
     * @returns {Promise<Object>} Стан гри
     */
    async getGameState(gameId) {
        return this.network.get(`/api/games/${gameId}/state`);
    }
    
    /**
     * Покидає гру
     * @param {string} gameId - ID гри
     * @returns {Promise<Object>} Результат виходу
     */
    async leaveGame(gameId) {
        return this.network.post(`/api/games/${gameId}/leave`);
    }
    
    /**
     * Отримує статистику гравця
     * @param {string} playerId - ID гравця
     * @returns {Promise<Object>} Статистика
     */
    async getPlayerStats(playerId) {
        return this.network.get(`/api/players/${playerId}/stats`);
    }
    
    /**
     * Отримує рейтинг гравців
     * @returns {Promise<Array>} Рейтинг
     */
    async getLeaderboard() {
        return this.network.get('/api/leaderboard');
    }
}

// Глобальні екземпляри
window.networkManager = new NetworkManager({
    baseURL: process.env.API_BASE_URL || '',
    timeout: 10000,
    retries: 3
});

window.gameAPI = new GameAPI(window.networkManager);

// Експорт для модулів
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NetworkManager, GameAPI, NetworkError };
} 