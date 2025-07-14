/**
 * Утиліта для оптимізації логування
 * @class LoggingOptimizer
 */
class LoggingOptimizer {
    static presets = {
        // Режим максимальної продуктивності
        performance: {
            level: 'ERROR',
            quickDisable: true,
            enableConsoleOutput: false,
            enableStorageOutput: false,
            maxLogs: 100
        },
        
        // Режим розробки
        development: {
            level: 'DEBUG',
            quickDisable: false,
            enableConsoleOutput: true,
            enableStorageOutput: true,
            maxLogs: 1000
        },
        
        // Режим тестування
        testing: {
            level: 'INFO',
            quickDisable: false,
            enableConsoleOutput: true,
            enableStorageOutput: false,
            maxLogs: 500
        },
        
        // Режим продакшену
        production: {
            level: 'WARN',
            quickDisable: false,
            enableConsoleOutput: false,
            enableStorageOutput: true,
            maxLogs: 200
        }
    };
    
    /**
     * Застосовує пресет налаштувань
     * @param {string} presetName - Назва пресету
     */
    static applyPreset(presetName) {
        if (!this.presets[presetName]) {
            console.error(`Пресет "${presetName}" не знайдено. Доступні:`, Object.keys(this.presets));
            return;
        }
        
        const preset = this.presets[presetName];
        Logger.configure(preset);
        
        console.log(`✅ Застосовано пресет "${presetName}"`);
        this.showCurrentStatus();
    }
    
    /**
     * Показує поточний стан логування
     */
    static showCurrentStatus() {
        const config = Logger.config;
        const stats = Logger.getStats();
        
        console.log('📊 Стан логування:');
        console.log(`   Рівень: ${config.level}`);
        console.log(`   Швидке вимкнення: ${config.quickDisable ? '✅' : '❌'}`);
        console.log(`   Консоль: ${config.enableConsoleOutput ? '✅' : '❌'}`);
        console.log(`   Збереження: ${config.enableStorageOutput ? '✅' : '❌'}`);
        console.log(`   Кількість логів: ${stats.total}`);
        console.log(`   Логи по рівнях:`, stats.byLevel);
    }
    
    /**
     * Швидко вимикає логування
     */
    static disable() {
        Logger.config.quickDisable = true;
        console.log('🚫 Логування вимкнено');
    }
    
    /**
     * Швидко вмикає логування
     */
    static enable() {
        Logger.config.quickDisable = false;
        console.log('✅ Логування увімкнено');
    }
    
    /**
     * Встановлює рівень логування
     * @param {string} level - Рівень (ERROR, WARN, INFO, DEBUG)
     */
    static setLevel(level) {
        Logger.config.level = level;
        console.log(`📝 Рівень логування встановлено: ${level}`);
    }
    
    /**
     * Очищує всі логи
     */
    static clear() {
        Logger.clear();
        console.log('🗑️ Всі логи очищено');
    }
    
    /**
     * Показує статистику логів
     */
    static stats() {
        const stats = Logger.getStats();
        console.log('📈 Статистика логів:', stats);
    }
    
    /**
     * Тестує продуктивність з різними налаштуваннями
     */
    static performanceTest() {
        console.log('🏃 Запуск тесту продуктивності...');
        
        const iterations = 1000;
        const results = {};
        
        // Тест без логування
        this.disable();
        const startTime1 = performance.now();
        for (let i = 0; i < iterations; i++) {
            // Симуляція операцій
            Math.random() * 100;
        }
        results.withoutLogging = performance.now() - startTime1;
        
        // Тест з ERROR логуванням
        this.enable();
        this.setLevel('ERROR');
        const startTime2 = performance.now();
        for (let i = 0; i < iterations; i++) {
            Logger.error('Test error', { i });
            Math.random() * 100;
        }
        results.withError = performance.now() - startTime2;
        
        // Тест з INFO логуванням
        this.setLevel('INFO');
        const startTime3 = performance.now();
        for (let i = 0; i < iterations; i++) {
            Logger.info('Test info', { i });
            Math.random() * 100;
        }
        results.withInfo = performance.now() - startTime3;
        
        // Тест з DEBUG логуванням
        this.setLevel('DEBUG');
        const startTime4 = performance.now();
        for (let i = 0; i < iterations; i++) {
            Logger.debug('Test debug', { i });
            Math.random() * 100;
        }
        results.withDebug = performance.now() - startTime4;
        
        // Результати
        console.log('📊 Результати тесту продуктивності:');
        console.log(`   Без логування: ${results.withoutLogging.toFixed(2)}ms`);
        console.log(`   З ERROR: ${results.withError.toFixed(2)}ms (+${((results.withError - results.withoutLogging) / results.withoutLogging * 100).toFixed(1)}%)`);
        console.log(`   З INFO: ${results.withInfo.toFixed(2)}ms (+${((results.withInfo - results.withoutLogging) / results.withoutLogging * 100).toFixed(1)}%)`);
        console.log(`   З DEBUG: ${results.withDebug.toFixed(2)}ms (+${((results.withDebug - results.withoutLogging) / results.withoutLogging * 100).toFixed(1)}%)`);
    }
    
    /**
     * Автоматично визначає оптимальні налаштування
     */
    static autoOptimize() {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isProduction = window.location.protocol === 'https:' && !isLocalhost;
        
        if (isProduction) {
            this.applyPreset('production');
        } else if (isLocalhost) {
            this.applyPreset('development');
        } else {
            this.applyPreset('testing');
        }
    }
}

// Додаємо глобальні функції для зручності
window.LoggingOptimizer = LoggingOptimizer;

// Автоматична оптимізація при завантаженні
if (typeof Logger !== 'undefined') {
    LoggingOptimizer.autoOptimize();
    
    // Додаємо команди в консоль
    console.log('🔧 LoggingOptimizer завантажено. Доступні команди:');
    console.log('   LoggingOptimizer.disable() - вимкнути логування');
    console.log('   LoggingOptimizer.enable() - увімкнути логування');
    console.log('   LoggingOptimizer.setLevel("ERROR") - встановити рівень');
    console.log('   LoggingOptimizer.applyPreset("performance") - застосувати пресет');
    console.log('   LoggingOptimizer.performanceTest() - тест продуктивності');
    console.log('   LoggingOptimizer.stats() - статистика');
} 