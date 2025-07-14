/**
 * Unit тести для Logger
 * @fileoverview Тестування системи логування
 */

describe('Logger', () => {
    let originalConfig;
    
    beforeEach(() => {
        // Зберігаємо оригінальну конфігурацію
        originalConfig = { ...Logger.config };
        
        // Встановлюємо тестову конфігурацію
        Logger.configure({
            level: 'DEBUG',
            maxLogs: 10,
            persistToStorage: false,
            sendToServer: false,
            showTimestamp: false,
            showLevel: false,
            groupByContext: false
        });
        
        // Очищуємо логи
        Logger.clear();
        Logger.clearStoredLogs();
    });
    
    afterEach(() => {
        // Відновлюємо оригінальну конфігурацію
        Logger.configure(originalConfig);
        Logger.clear();
        Logger.clearStoredLogs();
    });
    
    describe('Конфігурація', () => {
        it('повинен мати правильні рівні логування', () => {
            expect(Logger.levels.ERROR).toBe(0);
            expect(Logger.levels.WARN).toBe(1);
            expect(Logger.levels.INFO).toBe(2);
            expect(Logger.levels.DEBUG).toBe(3);
        });
        
        it('повинен налаштовувати конфігурацію', () => {
            const newConfig = {
                level: 'ERROR',
                maxLogs: 5,
                persistToStorage: true
            };
            
            Logger.configure(newConfig);
            
            expect(Logger.config.level).toBe('ERROR');
            expect(Logger.config.maxLogs).toBe(5);
            expect(Logger.config.persistToStorage).toBe(true);
        });
    });
    
    describe('Логування', () => {
        it('повинен логувати повідомлення', () => {
            Logger.log('INFO', 'Test message');
            
            expect(Logger.logs.length).toBe(1);
            expect(Logger.logs[0].level).toBe('INFO');
            expect(Logger.logs[0].message).toBe('Test message');
        });
        
        it('повинен фільтрувати логи за рівнем', () => {
            Logger.configure({ level: 'WARN' });
            
            Logger.debug('Debug message');
            Logger.info('Info message');
            Logger.warn('Warn message');
            Logger.error('Error message');
            
            expect(Logger.logs.length).toBe(2); // Тільки WARN та ERROR
            expect(Logger.logs[0].level).toBe('WARN');
            expect(Logger.logs[1].level).toBe('ERROR');
        });
        
        it('повинен зберігати метадані логу', () => {
            Logger.info('Test message', { key: 'value' }, 'test-context');
            
            const log = Logger.logs[0];
            expect(log.level).toBe('INFO');
            expect(log.message).toBe('Test message');
            expect(log.data).toEqual({ key: 'value' });
            expect(log.context).toBe('test-context');
            expect(log.timestamp).toBeDefined();
            expect(log.id).toBeDefined();
            expect(log.stack).toBeDefined();
        });
        
        it('повинен обмежувати кількість логів', () => {
            Logger.configure({ maxLogs: 3 });
            
            for (let i = 0; i < 5; i++) {
                Logger.info(`Message ${i}`);
            }
            
            expect(Logger.logs.length).toBe(3);
            expect(Logger.logs[0].message).toBe('Message 2');
            expect(Logger.logs[2].message).toBe('Message 4');
        });
    });
    
    describe('Методи логування', () => {
        it('повинен логувати помилки', () => {
            Logger.error('Error message', { error: 'details' });
            
            expect(Logger.logs[0].level).toBe('ERROR');
            expect(Logger.logs[0].message).toBe('Error message');
            expect(Logger.logs[0].data).toEqual({ error: 'details' });
        });
        
        it('повинен логувати попередження', () => {
            Logger.warn('Warning message');
            
            expect(Logger.logs[0].level).toBe('WARN');
            expect(Logger.logs[0].message).toBe('Warning message');
        });
        
        it('повинен логувати інформацію', () => {
            Logger.info('Info message');
            
            expect(Logger.logs[0].level).toBe('INFO');
            expect(Logger.logs[0].message).toBe('Info message');
        });
        
        it('повинен логувати дебаг', () => {
            Logger.debug('Debug message');
            
            expect(Logger.logs[0].level).toBe('DEBUG');
            expect(Logger.logs[0].message).toBe('Debug message');
        });
    });
    
    describe('Вимірювання продуктивності', () => {
        it('повинен логувати початок операції', () => {
            const startTime = Logger.start('test-operation', { data: 'test' });
            
            expect(typeof startTime).toBe('number');
            expect(Logger.logs[0].message).toBe('Started: test-operation');
            expect(Logger.logs[0].data.data).toBe('test');
            expect(Logger.logs[0].data.startTime).toBe(startTime);
        });
        
        it('повинен логувати завершення операції', () => {
            const startTime = Date.now();
            Logger.end('test-operation', startTime, { result: 'success' });
            
            expect(Logger.logs[0].message).toBe('Completed: test-operation');
            expect(Logger.logs[0].data.result).toBe('success');
            expect(Logger.logs[0].data.duration).toBeDefined();
        });
        
        it('повинен вимірювати виконання функції', () => {
            const result = Logger.measure('test-function', () => {
                return 'test-result';
            }, { context: 'test' });
            
            expect(result).toBe('test-result');
            expect(Logger.logs.length).toBe(2); // start + end
            expect(Logger.logs[0].message).toBe('Started: test-function');
            expect(Logger.logs[1].message).toBe('Completed: test-function');
            expect(Logger.logs[1].data.success).toBe(true);
        });
        
        it('повинен обробляти помилки в вимірюванні', () => {
            expect(() => {
                Logger.measure('test-function', () => {
                    throw new Error('Test error');
                });
            }).toThrow('Test error');
            
            expect(Logger.logs[1].data.success).toBe(false);
            expect(Logger.logs[1].data.error).toBe('Test error');
        });
    });
    
    describe('Групування по контексту', () => {
        it('повинен групувати логи по контексту', () => {
            Logger.configure({ groupByContext: true });
            
            Logger.info('Message 1', {}, 'context1');
            Logger.info('Message 2', {}, 'context2');
            Logger.info('Message 3', {}, 'context1');
            
            expect(Logger.contexts.has('context1')).toBe(true);
            expect(Logger.contexts.has('context2')).toBe(true);
            expect(Logger.contexts.get('context1').length).toBe(2);
            expect(Logger.contexts.get('context2').length).toBe(1);
        });
    });
    
    describe('Збереження в localStorage', () => {
        it('повинен зберігати логи в localStorage', () => {
            Logger.configure({ persistToStorage: true });
            
            Logger.info('Test message');
            
            const storedLogs = Logger.getStoredLogs();
            expect(storedLogs.length).toBe(1);
            expect(storedLogs[0].message).toBe('Test message');
        });
        
        it('повинен очищувати логи в localStorage', () => {
            Logger.configure({ persistToStorage: true });
            Logger.info('Test message');
            
            Logger.clearStoredLogs();
            
            const storedLogs = Logger.getStoredLogs();
            expect(storedLogs.length).toBe(0);
        });
        
        it('повинен обробляти помилки збереження', () => {
            // Симулюємо помилку localStorage
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => { throw new Error('Storage error'); };
            
            Logger.configure({ persistToStorage: true });
            
            // Не повинно кидати помилку
            expect(() => {
                Logger.info('Test message');
            }).not.toThrow();
            
            localStorage.setItem = originalSetItem;
        });
    });
    
    describe('Статистика', () => {
        it('повинен генерувати статистику', () => {
            Logger.error('Error 1');
            Logger.error('Error 2');
            Logger.warn('Warning 1');
            Logger.info('Info 1');
            Logger.debug('Debug 1');
            
            const stats = Logger.getStats();
            
            expect(stats.total).toBe(5);
            expect(stats.byLevel.ERROR).toBe(2);
            expect(stats.byLevel.WARN).toBe(1);
            expect(stats.byLevel.INFO).toBe(1);
            expect(stats.byLevel.DEBUG).toBe(1);
            expect(stats.recent.length).toBe(5);
        });
        
        it('повинен групувати статистику по контекстах', () => {
            Logger.configure({ groupByContext: true });
            
            Logger.info('Message 1', {}, 'context1');
            Logger.info('Message 2', {}, 'context2');
            Logger.info('Message 3', {}, 'context1');
            
            const stats = Logger.getStats();
            
            expect(stats.byContext.context1).toBe(2);
            expect(stats.byContext.context2).toBe(1);
        });
    });
    
    describe('Фільтрація', () => {
        it('повинен фільтрувати логи за рівнем', () => {
            Logger.error('Error message');
            Logger.warn('Warning message');
            Logger.info('Info message');
            
            const filtered = Logger.filter({ level: 'ERROR' });
            expect(filtered.length).toBe(1);
            expect(filtered[0].message).toBe('Error message');
        });
        
        it('повинен фільтрувати логи за контекстом', () => {
            Logger.info('Message 1', {}, 'context1');
            Logger.info('Message 2', {}, 'context2');
            
            const filtered = Logger.filter({ context: 'context1' });
            expect(filtered.length).toBe(1);
            expect(filtered[0].message).toBe('Message 1');
        });
        
        it('повинен фільтрувати логи за повідомленням', () => {
            Logger.info('Test message 1');
            Logger.info('Another message');
            Logger.info('Test message 2');
            
            const filtered = Logger.filter({ message: 'Test' });
            expect(filtered.length).toBe(2);
        });
        
        it('повинен фільтрувати логи за часом', () => {
            const now = new Date();
            const past = new Date(now.getTime() - 1000);
            const future = new Date(now.getTime() + 1000);
            
            Logger.info('Past message');
            Logger.logs[0].timestamp = past.toISOString();
            
            Logger.info('Future message');
            Logger.logs[1].timestamp = future.toISOString();
            
            const filtered = Logger.filter({ from: now });
            expect(filtered.length).toBe(1);
            expect(filtered[0].message).toBe('Future message');
        });
    });
    
    describe('Утиліти', () => {
        it('повинен генерувати унікальні ID', () => {
            const id1 = Logger.generateLogId();
            const id2 = Logger.generateLogId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toContain('log_');
        });
        
        it('повинен отримувати стек викликів', () => {
            const stack = Logger.getStackTrace();
            expect(typeof stack).toBe('string');
            expect(stack).toContain('getStackTrace');
        });
        
        it('повинен очищувати всі логи', () => {
            Logger.info('Message 1');
            Logger.info('Message 2');
            
            Logger.clear();
            
            expect(Logger.logs.length).toBe(0);
            expect(Logger.contexts.size).toBe(0);
        });
    });
});

// Запускаємо тести якщо файл виконано напряму
if (typeof window !== 'undefined' && window.currentTestRunner) {
    window.currentTestRunner.run().then(summary => {
        Logger.info('Logger tests completed:', summary);
    }).catch(error => {
        Logger.error('Logger tests failed:', error);
    });
} 