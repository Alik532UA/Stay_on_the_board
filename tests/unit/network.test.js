/**
 * Unit тести для мережевої системи
 */

// Імпортуємо TestRunner
const testRunner = new TestRunner();

// Мокаємо fetch для тестування
const originalFetch = window.fetch;
let mockFetchCalls = [];

beforeEach(() => {
    mockFetchCalls = [];
    window.fetch = jest.fn((url, options) => {
        mockFetchCalls.push({ url, options });
        return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map([['content-type', 'application/json']]),
            json: () => Promise.resolve({ success: true, data: 'test' }),
            text: () => Promise.resolve('test'),
            url: url
        });
    });
});

afterEach(() => {
    window.fetch = originalFetch;
    if (window.networkManager) {
        window.networkManager.destroy();
    }
});

describe('NetworkManager', () => {
    test('should initialize with default options', () => {
        const network = new NetworkManager();
        
        expect(network.baseURL).toBe('');
        expect(network.timeout).toBe(10000);
        expect(network.retries).toBe(3);
        expect(network.retryDelay).toBe(1000);
        expect(network.enableCache).toBe(true);
        expect(network.isDestroyed).toBe(false);
    });
    
    test('should initialize with custom options', () => {
        const options = {
            baseURL: 'https://api.example.com',
            timeout: 5000,
            retries: 5,
            retryDelay: 2000,
            headers: { 'Authorization': 'Bearer token' },
            withCredentials: true,
            enableCache: false,
            cacheTimeout: 60000
        };
        
        const network = new NetworkManager(options);
        
        expect(network.baseURL).toBe(options.baseURL);
        expect(network.timeout).toBe(options.timeout);
        expect(network.retries).toBe(options.retries);
        expect(network.retryDelay).toBe(options.retryDelay);
        expect(network.withCredentials).toBe(options.withCredentials);
        expect(network.enableCache).toBe(options.enableCache);
        expect(network.cacheTimeout).toBe(options.cacheTimeout);
    });
    
    test('should build URL correctly', () => {
        const network = new NetworkManager({ baseURL: 'https://api.example.com' });
        
        expect(network.buildURL('/users')).toBe('https://api.example.com/users');
        expect(network.buildURL('users')).toBe('https://api.example.com/users');
        expect(network.buildURL('https://other.com/users')).toBe('https://other.com/users');
    });
    
    test('should make GET request', async () => {
        const network = new NetworkManager();
        
        const response = await network.get('/test');
        
        expect(mockFetchCalls).toHaveLength(1);
        expect(mockFetchCalls[0].url).toBe('/test');
        expect(mockFetchCalls[0].options.method).toBe('GET');
        expect(response.data).toEqual({ success: true, data: 'test' });
    });
    
    test('should make POST request', async () => {
        const network = new NetworkManager();
        const data = { name: 'test' };
        
        const response = await network.post('/test', data);
        
        expect(mockFetchCalls).toHaveLength(1);
        expect(mockFetchCalls[0].url).toBe('/test');
        expect(mockFetchCalls[0].options.method).toBe('POST');
        expect(mockFetchCalls[0].options.body).toBe(JSON.stringify(data));
        expect(response.data).toEqual({ success: true, data: 'test' });
    });
    
    test('should make PUT request', async () => {
        const network = new NetworkManager();
        const data = { name: 'test' };
        
        const response = await network.put('/test', data);
        
        expect(mockFetchCalls).toHaveLength(1);
        expect(mockFetchCalls[0].options.method).toBe('PUT');
        expect(mockFetchCalls[0].options.body).toBe(JSON.stringify(data));
    });
    
    test('should make DELETE request', async () => {
        const network = new NetworkManager();
        
        const response = await network.delete('/test');
        
        expect(mockFetchCalls).toHaveLength(1);
        expect(mockFetchCalls[0].options.method).toBe('DELETE');
    });
    
    test('should handle HTTP errors', async () => {
        window.fetch = jest.fn(() => Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            headers: new Map(),
            json: () => Promise.resolve({ error: 'Not found' })
        }));
        
        const network = new NetworkManager();
        
        await expect(network.get('/test')).rejects.toThrow('HTTP 404: Not Found');
    });
    
    test('should retry failed requests', async () => {
        let callCount = 0;
        window.fetch = jest.fn(() => {
            callCount++;
            if (callCount < 3) {
                return Promise.reject(new Error('Network error'));
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Map([['content-type', 'application/json']]),
                json: () => Promise.resolve({ success: true })
            });
        });
        
        const network = new NetworkManager({ retries: 2 });
        
        const response = await network.get('/test');
        
        expect(callCount).toBe(3);
        expect(response.data).toEqual({ success: true });
    });
    
    test('should cache GET requests', async () => {
        const network = new NetworkManager({ enableCache: true });
        
        // Перший запит
        const response1 = await network.get('/test');
        
        // Другий запит (повинен бути з кешу)
        const response2 = await network.get('/test');
        
        expect(mockFetchCalls).toHaveLength(1);
        expect(response1).toEqual(response2);
    });
    
    test('should not cache non-GET requests', async () => {
        const network = new NetworkManager({ enableCache: true });
        
        await network.post('/test', { data: 'test' });
        await network.post('/test', { data: 'test' });
        
        expect(mockFetchCalls).toHaveLength(2);
    });
    
    test('should clear cache', async () => {
        const network = new NetworkManager({ enableCache: true });
        
        await network.get('/test1');
        await network.get('/test2');
        
        expect(network.cache.size).toBe(2);
        
        network.clearCache('/test1');
        expect(network.cache.size).toBe(1);
        
        network.clearCache();
        expect(network.cache.size).toBe(0);
    });
    
    test('should handle request middleware', async () => {
        const network = new NetworkManager();
        
        network.useRequest((config) => {
            config.headers['X-Custom-Header'] = 'test';
            return config;
        });
        
        await network.get('/test');
        
        expect(mockFetchCalls[0].options.headers['X-Custom-Header']).toBe('test');
    });
    
    test('should handle response middleware', async () => {
        const network = new NetworkManager();
        
        network.useResponse((response) => {
            response.customField = 'test';
            return response;
        });
        
        const response = await network.get('/test');
        
        expect(response.customField).toBe('test');
    });
    
    test('should handle error middleware', async () => {
        window.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
        
        const network = new NetworkManager();
        let errorHandled = false;
        
        network.useError((error) => {
            errorHandled = true;
        });
        
        try {
            await network.get('/test');
        } catch (error) {
            // Очікувана помилка
        }
        
        expect(errorHandled).toBe(true);
    });
    
    test('should handle pending requests', async () => {
        const network = new NetworkManager();
        
        // Запускаємо два однакових запити одночасно
        const promise1 = network.get('/test');
        const promise2 = network.get('/test');
        
        await Promise.all([promise1, promise2]);
        
        // Повинен бути тільки один реальний запит
        expect(mockFetchCalls).toHaveLength(1);
    });
    
    test('should handle timeout', async () => {
        window.fetch = jest.fn(() => new Promise(() => {})); // Ніколи не завершується
        
        const network = new NetworkManager({ timeout: 100 });
        
        await expect(network.get('/test')).rejects.toThrow();
    });
    
    test('should get stats', () => {
        const network = new NetworkManager();
        
        const stats = network.getStats();
        
        expect(stats.requestCount).toBe(0);
        expect(stats.pendingRequests).toBe(0);
        expect(stats.cacheSize).toBe(0);
        expect(stats.baseURL).toBe('');
    });
    
    test('should destroy instance', () => {
        const network = new NetworkManager();
        
        expect(network.isDestroyed).toBe(false);
        
        network.destroy();
        
        expect(network.isDestroyed).toBe(true);
        expect(network.cache.size).toBe(0);
        expect(network.pendingRequests.size).toBe(0);
    });
    
    test('should not make requests when destroyed', async () => {
        const network = new NetworkManager();
        network.destroy();
        
        await expect(network.get('/test')).rejects.toThrow('NetworkManager is destroyed');
    });
});

describe('GameAPI', () => {
    let networkManager;
    let gameAPI;
    
    beforeEach(() => {
        networkManager = new NetworkManager();
        gameAPI = new GameAPI(networkManager);
    });
    
    afterEach(() => {
        networkManager.destroy();
    });
    
    test('should get games', async () => {
        await gameAPI.getGames();
        
        expect(mockFetchCalls[0].url).toBe('/api/games');
        expect(mockFetchCalls[0].options.method).toBe('GET');
    });
    
    test('should create game', async () => {
        const gameData = { name: 'Test Game', size: 5 };
        
        await gameAPI.createGame(gameData);
        
        expect(mockFetchCalls[0].url).toBe('/api/games');
        expect(mockFetchCalls[0].options.method).toBe('POST');
        expect(mockFetchCalls[0].options.body).toBe(JSON.stringify(gameData));
    });
    
    test('should join game', async () => {
        const gameId = 'game123';
        const playerData = { name: 'Player 1' };
        
        await gameAPI.joinGame(gameId, playerData);
        
        expect(mockFetchCalls[0].url).toBe('/api/games/game123/join');
        expect(mockFetchCalls[0].options.method).toBe('POST');
        expect(mockFetchCalls[0].options.body).toBe(JSON.stringify(playerData));
    });
    
    test('should make move', async () => {
        const gameId = 'game123';
        const moveData = { row: 1, col: 2 };
        
        await gameAPI.makeMove(gameId, moveData);
        
        expect(mockFetchCalls[0].url).toBe('/api/games/game123/move');
        expect(mockFetchCalls[0].options.method).toBe('POST');
        expect(mockFetchCalls[0].options.body).toBe(JSON.stringify(moveData));
    });
    
    test('should get game state', async () => {
        const gameId = 'game123';
        
        await gameAPI.getGameState(gameId);
        
        expect(mockFetchCalls[0].url).toBe('/api/games/game123/state');
        expect(mockFetchCalls[0].options.method).toBe('GET');
    });
    
    test('should leave game', async () => {
        const gameId = 'game123';
        
        await gameAPI.leaveGame(gameId);
        
        expect(mockFetchCalls[0].url).toBe('/api/games/game123/leave');
        expect(mockFetchCalls[0].options.method).toBe('POST');
    });
    
    test('should get player stats', async () => {
        const playerId = 'player123';
        
        await gameAPI.getPlayerStats(playerId);
        
        expect(mockFetchCalls[0].url).toBe('/api/players/player123/stats');
        expect(mockFetchCalls[0].options.method).toBe('GET');
    });
    
    test('should get leaderboard', async () => {
        await gameAPI.getLeaderboard();
        
        expect(mockFetchCalls[0].url).toBe('/api/leaderboard');
        expect(mockFetchCalls[0].options.method).toBe('GET');
    });
});

describe('NetworkError', () => {
    test('should create network error', () => {
        const error = new NetworkError('Test error', 404, 'Not Found');
        
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('NetworkError');
        expect(error.status).toBe(404);
        expect(error.statusText).toBe('Not Found');
    });
});

// Запускаємо тести
testRunner.run().then(summary => {
    console.log('Network tests completed:', summary);
}); 