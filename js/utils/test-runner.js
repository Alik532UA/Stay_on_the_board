/**
 * Простий тест-ранер для unit тестування
 * @class TestRunner
 */
class TestRunner {
    constructor() {
        this.tests = new Map();
        this.beforeEach = null;
        this.afterEach = null;
        this.beforeAll = null;
        this.afterAll = null;
        this.results = [];
        this.isRunning = false;
    }
    
    /**
     * Реєструє тест
     * @param {string} name - Назва тесту
     * @param {Function} testFn - Функція тесту
     * @param {Object} options - Опції тесту
     */
    test(name, testFn, options = {}) {
        this.tests.set(name, { testFn, options });
    }
    
    /**
     * Реєструє тест, який повинен викинути помилку
     * @param {string} name - Назва тесту
     * @param {Function} testFn - Функція тесту
     * @param {string|Function} expectedError - Очікувана помилка
     */
    testThrows(name, testFn, expectedError) {
        this.test(name, async () => {
            try {
                await testFn();
                throw new Error('Expected function to throw an error');
            } catch (error) {
                if (typeof expectedError === 'string') {
                    if (!error.message.includes(expectedError)) {
                        throw new Error(`Expected error to contain "${expectedError}", but got "${error.message}"`);
                    }
                } else if (typeof expectedError === 'function') {
                    if (!(error instanceof expectedError)) {
                        throw new Error(`Expected error to be instance of ${expectedError.name}, but got ${error.constructor.name}`);
                    }
                }
            }
        });
    }
    
    /**
     * Встановлює функцію, яка виконується перед кожним тестом
     * @param {Function} fn - Функція
     */
    beforeEach(fn) {
        this.beforeEach = fn;
    }
    
    /**
     * Встановлює функцію, яка виконується після кожного тесту
     * @param {Function} fn - Функція
     */
    afterEach(fn) {
        this.afterEach = fn;
    }
    
    /**
     * Встановлює функцію, яка виконується перед всіма тестами
     * @param {Function} fn - Функція
     */
    beforeAll(fn) {
        this.beforeAll = fn;
    }
    
    /**
     * Встановлює функцію, яка виконується після всіх тестів
     * @param {Function} fn - Функція
     */
    afterAll(fn) {
        this.afterAll = fn;
    }
    
    /**
     * Запускає всі тести
     * @param {Object} options - Опції запуску
     * @returns {Promise<Object>} Результати тестів
     */
    async run(options = {}) {
        if (this.isRunning) {
            throw new Error('TestRunner is already running');
        }
        
        this.isRunning = true;
        this.results = [];
        
        const startTime = Date.now();
        
        try {
            // Виконуємо beforeAll
            if (this.beforeAll) {
                await this.beforeAll();
            }
            
            // Запускаємо тести
            for (const [name, { testFn, options: testOptions }] of this.tests) {
                await this.runTest(name, testFn, testOptions);
            }
            
            // Виконуємо afterAll
            if (this.afterAll) {
                await this.afterAll();
            }
        } finally {
            this.isRunning = false;
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const summary = this.generateSummary(duration);
        
        // Виводимо результати
        this.outputResults(summary);
        
        return summary;
    }
    
    /**
     * Запускає один тест
     * @param {string} name - Назва тесту
     * @param {Function} testFn - Функція тесту
     * @param {Object} options - Опції тесту
     */
    async runTest(name, testFn, options = {}) {
        const testStartTime = Date.now();
        const result = {
            name,
            status: 'pending',
            duration: 0,
            error: null,
            startTime: testStartTime
        };
        
        try {
            // Виконуємо beforeEach
            if (this.beforeEach) {
                await this.beforeEach();
            }
            
            // Запускаємо тест
            const testResult = testFn();
            
            // Обробляємо Promise якщо потрібно
            if (testResult && typeof testResult.then === 'function') {
                await testResult;
            }
            
            result.status = 'passed';
            
        } catch (error) {
            result.status = 'failed';
            result.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        } finally {
            // Виконуємо afterEach
            if (this.afterEach) {
                try {
                    await this.afterEach();
                } catch (error) {
                    Logger.error('afterEach error:', error);
                }
            }
            
            result.duration = Date.now() - testStartTime;
            this.results.push(result);
        }
    }
    
    /**
     * Генерує зведення результатів
     * @param {number} totalDuration - Загальний час виконання
     * @returns {Object} Зведення
     */
    generateSummary(totalDuration) {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;
        
        return {
            total,
            passed,
            failed,
            duration: totalDuration,
            successRate: total > 0 ? (passed / total) * 100 : 0,
            results: this.results
        };
    }
    
    /**
     * Виводить результати в консоль
     * @param {Object} summary - Зведення результатів
     */
    outputResults(summary) {
        Logger.info('\n' + '='.repeat(50));
        Logger.info('🧪 TEST RESULTS');
        Logger.info('='.repeat(50));
        
        // Виводимо кожен тест
        for (const result of summary.results) {
            const status = result.status === 'passed' ? '✅' : '❌';
            const duration = `${result.duration}ms`;
            
            Logger.info(`${status} ${result.name} (${duration})`);
            
            if (result.error) {
                Logger.error(`   Error: ${result.error.message}`);
                if (result.error.stack) {
                    Logger.error(`   Stack: ${result.error.stack}`);
                }
            }
        }
        
        // Виводимо зведення
        Logger.info('\n' + '-'.repeat(50));
        Logger.info(`📊 SUMMARY:`);
        Logger.info(`   Total: ${summary.total}`);
        Logger.info(`   Passed: ${summary.passed} ✅`);
        Logger.info(`   Failed: ${summary.failed} ❌`);
        Logger.info(`   Success Rate: ${summary.successRate.toFixed(1)}%`);
        Logger.info(`   Duration: ${summary.duration}ms`);
        Logger.info('='.repeat(50) + '\n');
        
        // Якщо є помилки, кидаємо виняток
        if (summary.failed > 0) {
            throw new Error(`${summary.failed} test(s) failed`);
        }
    }
    
    /**
     * Очищує всі тести
     */
    clear() {
        this.tests.clear();
        this.results = [];
        this.beforeEach = null;
        this.afterEach = null;
        this.beforeAll = null;
        this.afterAll = null;
    }
    
    /**
     * Отримує статистику тестів
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            totalTests: this.tests.size,
            totalResults: this.results.length,
            passed: this.results.filter(r => r.status === 'passed').length,
            failed: this.results.filter(r => r.status === 'failed').length
        };
    }
}

// Глобальні функції для зручності
window.describe = function(name, fn) {
    Logger.info(`\n📁 ${name}`);
    fn();
};

window.it = function(name, fn) {
    if (!window.currentTestRunner) {
        window.currentTestRunner = new TestRunner();
    }
    window.currentTestRunner.test(name, fn);
};

window.expect = function(value) {
    return {
        toBe: function(expected) {
            if (value !== expected) {
                throw new Error(`Expected ${value} to be ${expected}`);
            }
        },
        toEqual: function(expected) {
            if (JSON.stringify(value) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
            }
        },
        toContain: function(expected) {
            if (Array.isArray(value)) {
                if (!value.includes(expected)) {
                    throw new Error(`Expected array to contain ${expected}`);
                }
            } else if (typeof value === 'string') {
                if (!value.includes(expected)) {
                    throw new Error(`Expected string to contain ${expected}`);
                }
            } else {
                throw new Error('toContain can only be used with arrays and strings');
            }
        },
        toBeDefined: function() {
            if (value === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBeNull: function() {
            if (value !== null) {
                throw new Error(`Expected ${value} to be null`);
            }
        },
        toBeTruthy: function() {
            if (!value) {
                throw new Error(`Expected ${value} to be truthy`);
            }
        },
        toBeFalsy: function() {
            if (value) {
                throw new Error(`Expected ${value} to be falsy`);
            }
        }
    };
};

// Експорт для використання в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestRunner;
} else {
    window.TestRunner = TestRunner;
} 