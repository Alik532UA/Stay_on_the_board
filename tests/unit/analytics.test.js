/**
 * Unit тести для системи аналітики
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
            json: () => Promise.resolve({ success: true })
        });
    });
});

afterEach(() => {
    window.fetch = originalFetch;
    if (window.analytics) {
        window.analytics.destroy();
    }
});

describe('Analytics', () => {
    test('should initialize with default options', () => {
        const analytics = new Analytics();
        
        expect(analytics.enabled).toBe(true);
        expect(analytics.sessionId).toBeDefined();
        expect(analytics.userId).toBeDefined();
        expect(analytics.events).toEqual([]);
        expect(analytics.isDestroyed).toBe(false);
    });
    
    test('should initialize with custom options', () => {
        const options = {
            enabled: false,
            sessionId: 'test_session',
            userId: 'test_user',
            endpoint: 'https://api.example.com/analytics',
            batchSize: 5,
            flushInterval: 10000,
            maxEvents: 500
        };
        
        const analytics = new Analytics(options);
        
        expect(analytics.enabled).toBe(options.enabled);
        expect(analytics.sessionId).toBe(options.sessionId);
        expect(analytics.userId).toBe(options.userId);
        expect(analytics.endpoint).toBe(options.endpoint);
        expect(analytics.batchSize).toBe(options.batchSize);
        expect(analytics.flushInterval).toBe(options.flushInterval);
        expect(analytics.maxEvents).toBe(options.maxEvents);
    });
    
    test('should track events when enabled', () => {
        const analytics = new Analytics({ enabled: true });
        
        analytics.track('test_event', { data: 'test' });
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('test_event');
        expect(analytics.events[0].data).toEqual({ data: 'test' });
        expect(analytics.events[0].timestamp).toBeDefined();
        expect(analytics.events[0].sessionId).toBe(analytics.sessionId);
        expect(analytics.events[0].userId).toBe(analytics.userId);
    });
    
    test('should not track events when disabled', () => {
        const analytics = new Analytics({ enabled: false });
        
        analytics.track('test_event', { data: 'test' });
        
        expect(analytics.events).toHaveLength(0);
    });
    
    test('should not track events when destroyed', () => {
        const analytics = new Analytics();
        analytics.destroy();
        
        analytics.track('test_event', { data: 'test' });
        
        expect(analytics.events).toHaveLength(0);
    });
    
    test('should limit events to maxEvents', () => {
        const analytics = new Analytics({ maxEvents: 3 });
        
        analytics.track('event1');
        analytics.track('event2');
        analytics.track('event3');
        analytics.track('event4');
        
        expect(analytics.events).toHaveLength(3);
        expect(analytics.events[0].event).toBe('event2');
        expect(analytics.events[1].event).toBe('event3');
        expect(analytics.events[2].event).toBe('event4');
    });
    
    test('should track page view', () => {
        const analytics = new Analytics();
        
        analytics.trackPageView();
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('page_view');
        expect(analytics.events[0].data.title).toBe(document.title);
        expect(analytics.events[0].data.referrer).toBe(document.referrer);
    });
    
    test('should track click', () => {
        const analytics = new Analytics();
        
        analytics.trackClick('button', { id: 'test-button' });
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('click');
        expect(analytics.events[0].data.element).toBe('button');
        expect(analytics.events[0].data.id).toBe('test-button');
    });
    
    test('should track action', () => {
        const analytics = new Analytics();
        
        analytics.trackAction('save', { file: 'test.txt' });
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('action');
        expect(analytics.events[0].data.action).toBe('save');
        expect(analytics.events[0].data.file).toBe('test.txt');
    });
    
    test('should track error', () => {
        const analytics = new Analytics();
        const error = new Error('Test error');
        
        analytics.trackError(error, { context: 'test' });
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('error');
        expect(analytics.events[0].data.error).toBe('Test error');
        expect(analytics.events[0].data.stack).toBeDefined();
        expect(analytics.events[0].data.context).toBe('test');
    });
    
    test('should track performance', () => {
        const analytics = new Analytics();
        
        analytics.trackPerformance('load_time', 150, { page: 'home' });
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('performance');
        expect(analytics.events[0].data.metric).toBe('load_time');
        expect(analytics.events[0].data.value).toBe(150);
        expect(analytics.events[0].data.page).toBe('home');
    });
    
    test('should track game event', () => {
        const analytics = new Analytics();
        
        analytics.trackGameEvent('move', { player: 1, position: { x: 1, y: 2 } });
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('game_event');
        expect(analytics.events[0].data.gameEvent).toBe('move');
        expect(analytics.events[0].data.player).toBe(1);
        expect(analytics.events[0].data.position).toEqual({ x: 1, y: 2 });
    });
    
    test('should track setting change', () => {
        const analytics = new Analytics();
        
        analytics.trackSetting('theme', 'dark');
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('setting_change');
        expect(analytics.events[0].data.setting).toBe('theme');
        expect(analytics.events[0].data.value).toBe('dark');
    });
    
    test('should track user agent', () => {
        const analytics = new Analytics();
        
        analytics.trackUserAgent();
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('user_agent');
        expect(analytics.events[0].data.userAgent).toBe(navigator.userAgent);
        expect(analytics.events[0].data.language).toBe(navigator.language);
        expect(analytics.events[0].data.platform).toBe(navigator.platform);
    });
    
    test('should track screen size', () => {
        const analytics = new Analytics();
        
        analytics.trackScreenSize();
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.events[0].event).toBe('screen_size');
        expect(analytics.events[0].data.screen.width).toBe(window.screen.width);
        expect(analytics.events[0].data.screen.height).toBe(window.screen.height);
        expect(analytics.events[0].data.viewport.width).toBe(window.innerWidth);
        expect(analytics.events[0].data.viewport.height).toBe(window.innerHeight);
    });
    
    test('should flush events when batch size reached', async () => {
        const analytics = new Analytics({ 
            endpoint: 'https://api.example.com/analytics',
            batchSize: 2 
        });
        
        analytics.track('event1');
        analytics.track('event2');
        
        // Чекаємо на асинхронну операцію
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(mockFetchCalls).toHaveLength(1);
        expect(mockFetchCalls[0].url).toBe('https://api.example.com/analytics');
        expect(mockFetchCalls[0].options.method).toBe('POST');
        
        const body = JSON.parse(mockFetchCalls[0].options.body);
        expect(body.sessionId).toBe(analytics.sessionId);
        expect(body.userId).toBe(analytics.userId);
        expect(body.events).toHaveLength(2);
    });
    
    test('should not flush when no endpoint', async () => {
        const analytics = new Analytics({ batchSize: 1 });
        
        analytics.track('event1');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(mockFetchCalls).toHaveLength(0);
    });
    
    test('should handle flush errors gracefully', async () => {
        window.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
        
        const analytics = new Analytics({ 
            endpoint: 'https://api.example.com/analytics',
            batchSize: 1 
        });
        
        analytics.track('event1');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Події повинні залишитися в черзі
        expect(analytics.events).toHaveLength(1);
    });
    
    test('should get stats', () => {
        const analytics = new Analytics();
        
        analytics.track('event1');
        analytics.track('event2');
        analytics.track('event1');
        
        const stats = analytics.getStats();
        
        expect(stats.totalEvents).toBe(3);
        expect(stats.sessionId).toBe(analytics.sessionId);
        expect(stats.userId).toBe(analytics.userId);
        expect(stats.eventTypes.event1).toBe(2);
        expect(stats.eventTypes.event2).toBe(1);
    });
    
    test('should export data', () => {
        const analytics = new Analytics();
        
        analytics.track('test_event', { data: 'test' });
        
        const exported = analytics.export();
        
        expect(exported.sessionId).toBe(analytics.sessionId);
        expect(exported.userId).toBe(analytics.userId);
        expect(exported.events).toHaveLength(1);
        expect(exported.stats).toBeDefined();
    });
    
    test('should clear events', () => {
        const analytics = new Analytics();
        
        analytics.track('event1');
        analytics.track('event2');
        
        expect(analytics.events).toHaveLength(2);
        
        analytics.clear();
        
        expect(analytics.events).toHaveLength(0);
    });
    
    test('should destroy instance', () => {
        const analytics = new Analytics();
        
        analytics.track('event1');
        
        expect(analytics.events).toHaveLength(1);
        expect(analytics.isDestroyed).toBe(false);
        
        analytics.destroy();
        
        expect(analytics.isDestroyed).toBe(true);
        expect(analytics.events).toHaveLength(0);
        
        // Подальші події не повинні відстежуватися
        analytics.track('event2');
        expect(analytics.events).toHaveLength(0);
    });
    
    test('should generate unique session ID', () => {
        const analytics1 = new Analytics();
        const analytics2 = new Analytics();
        
        expect(analytics1.sessionId).not.toBe(analytics2.sessionId);
        expect(analytics1.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
    
    test('should get or create user ID', () => {
        // Очищуємо localStorage
        localStorage.removeItem('analytics_user_id');
        
        const analytics1 = new Analytics();
        const analytics2 = new Analytics();
        
        // Перший повинен створити новий ID
        expect(analytics1.userId).toMatch(/^user_\d+_[a-z0-9]+$/);
        
        // Другий повинен використати той самий ID
        expect(analytics2.userId).toBe(analytics1.userId);
    });
});

// Запускаємо тести
testRunner.run().then(summary => {
    Logger.info('Analytics tests completed:', summary);
}); 