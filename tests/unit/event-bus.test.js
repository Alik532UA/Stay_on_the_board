/**
 * Unit тести для EventBus
 * @fileoverview Тестування системи подій
 */

describe('EventBus', () => {
    let eventBus;
    
    beforeEach(() => {
        eventBus = new EventBus();
    });
    
    afterEach(() => {
        if (eventBus) {
            eventBus.destroy();
        }
    });
    
    describe('Конструктор', () => {
        it('повинен створити EventBus з порожніми колекціями', () => {
            expect(eventBus.listeners).toBeDefined();
            expect(eventBus.middleware).toBeDefined();
            expect(eventBus.eventHistory).toBeDefined();
            expect(eventBus.isDestroyed).toBe(false);
        });
        
        it('повинен ініціалізувати з правильними значеннями за замовчуванням', () => {
            expect(eventBus.maxHistorySize).toBe(100);
            expect(eventBus.listeners.size).toBe(0);
            expect(eventBus.middleware.length).toBe(0);
            expect(eventBus.eventHistory.length).toBe(0);
        });
    });
    
    describe('emit', () => {
        it('повинен відправити подію без обробників', () => {
            const result = eventBus.emit('test-event', { data: 'test' });
            expect(result).toBe(false);
        });
        
        it('повинен відправити подію з обробником', () => {
            let receivedData = null;
            let receivedEventData = null;
            
            eventBus.on('test-event', (data, eventData) => {
                receivedData = data;
                receivedEventData = eventData;
            });
            
            const result = eventBus.emit('test-event', { data: 'test' });
            
            expect(result).toBe(true);
            expect(receivedData).toEqual({ data: 'test' });
            expect(receivedEventData.event).toBe('test-event');
            expect(receivedEventData.timestamp).toBeDefined();
            expect(receivedEventData.id).toBeDefined();
        });
        
        it('повинен зберігати подію в історії', () => {
            eventBus.emit('test-event', { data: 'test' });
            
            expect(eventBus.eventHistory.length).toBe(1);
            expect(eventBus.eventHistory[0].event).toBe('test-event');
            expect(eventBus.eventHistory[0].data).toEqual({ data: 'test' });
        });
        
        it('повинен обмежувати розмір історії', () => {
            // Відправляємо більше подій ніж maxHistorySize
            for (let i = 0; i < 110; i++) {
                eventBus.emit('test-event', { index: i });
            }
            
            expect(eventBus.eventHistory.length).toBeLessThanOrEqual(eventBus.maxHistorySize);
        });
        
        it('повинен обробляти помилки в обробниках', () => {
            let errorThrown = false;
            
            eventBus.on('test-event', () => {
                throw new Error('Test error');
            });
            
            try {
                eventBus.emit('test-event', { data: 'test' });
            } catch (error) {
                errorThrown = true;
            }
            
            expect(errorThrown).toBe(false); // Помилки не повинні прокидатися
        });
        
        it('повинен зупиняти виконання при stopPropagation', () => {
            let handler1Called = false;
            let handler2Called = false;
            
            eventBus.on('test-event', () => {
                handler1Called = true;
                return false; // Зупиняємо виконання
            }, { stopPropagation: true });
            
            eventBus.on('test-event', () => {
                handler2Called = true;
            });
            
            eventBus.emit('test-event', { data: 'test' });
            
            expect(handler1Called).toBe(true);
            expect(handler2Called).toBe(false);
        });
        
        it('повинен кидати помилку при throwOnError', () => {
            let errorThrown = false;
            
            eventBus.on('test-event', () => {
                throw new Error('Test error');
            }, { throwOnError: true });
            
            try {
                eventBus.emit('test-event', { data: 'test' });
            } catch (error) {
                errorThrown = true;
                expect(error.message).toBe('Test error');
            }
            
            expect(errorThrown).toBe(true);
        });
        
        it('повинен повернути false якщо EventBus знищений', () => {
            eventBus.destroy();
            const result = eventBus.emit('test-event', { data: 'test' });
            expect(result).toBe(false);
        });
    });
    
    describe('on', () => {
        it('повинен підписатися на подію', () => {
            let called = false;
            const unsubscribe = eventBus.on('test-event', () => {
                called = true;
            });
            
            expect(typeof unsubscribe).toBe('function');
            
            eventBus.emit('test-event');
            expect(called).toBe(true);
        });
        
        it('повинен підписатися на кілька обробників', () => {
            let callCount = 0;
            
            eventBus.on('test-event', () => { callCount++; });
            eventBus.on('test-event', () => { callCount++; });
            
            eventBus.emit('test-event');
            expect(callCount).toBe(2);
        });
        
        it('повинен повернути порожню функцію якщо EventBus знищений', () => {
            eventBus.destroy();
            const unsubscribe = eventBus.on('test-event', () => {});
            expect(typeof unsubscribe).toBe('function');
        });
    });
    
    describe('off', () => {
        it('повинен відписатися від події', () => {
            let called = false;
            const handler = () => { called = true; };
            
            eventBus.on('test-event', handler);
            eventBus.off('test-event', handler);
            
            eventBus.emit('test-event');
            expect(called).toBe(false);
        });
        
        it('повинен видалити порожній масив обробників', () => {
            const handler = () => {};
            
            eventBus.on('test-event', handler);
            eventBus.off('test-event', handler);
            
            expect(eventBus.listeners.has('test-event')).toBe(false);
        });
        
        it('повинен обробляти неіснуючі події', () => {
            expect(() => {
                eventBus.off('nonexistent-event', () => {});
            }).not.toThrow();
        });
    });
    
    describe('once', () => {
        it('повинен виконати обробник тільки один раз', () => {
            let callCount = 0;
            
            eventBus.once('test-event', () => {
                callCount++;
            });
            
            eventBus.emit('test-event');
            eventBus.emit('test-event');
            
            expect(callCount).toBe(1);
        });
        
        it('повинен автоматично відписатися після виконання', () => {
            eventBus.once('test-event', () => {});
            eventBus.emit('test-event');
            
            expect(eventBus.listeners.has('test-event')).toBe(false);
        });
    });
    
    describe('use', () => {
        it('повинен додати middleware', () => {
            const middleware = (eventData) => {
                eventData.data.modified = true;
                return eventData.data;
            };
            
            eventBus.use(middleware);
            expect(eventBus.middleware.length).toBe(1);
        });
        
        it('повинен застосувати middleware до події', () => {
            let receivedData = null;
            
            eventBus.use((eventData) => {
                eventData.data.modified = true;
                return eventData.data;
            });
            
            eventBus.on('test-event', (data) => {
                receivedData = data;
            });
            
            eventBus.emit('test-event', { original: true });
            
            expect(receivedData.modified).toBe(true);
            expect(receivedData.original).toBe(true);
        });
        
        it('повинен обробляти помилки в middleware', () => {
            let errorThrown = false;
            
            eventBus.use(() => {
                throw new Error('Middleware error');
            });
            
            try {
                eventBus.emit('test-event', { data: 'test' });
            } catch (error) {
                errorThrown = true;
            }
            
            expect(errorThrown).toBe(false); // Помилки не повинні прокидатися
        });
    });
    
    describe('getListenerCount', () => {
        it('повинен повернути кількість обробників', () => {
            expect(eventBus.getListenerCount('test-event')).toBe(0);
            
            eventBus.on('test-event', () => {});
            expect(eventBus.getListenerCount('test-event')).toBe(1);
            
            eventBus.on('test-event', () => {});
            expect(eventBus.getListenerCount('test-event')).toBe(2);
        });
        
        it('повинен повернути 0 для неіснуючої події', () => {
            expect(eventBus.getListenerCount('nonexistent-event')).toBe(0);
        });
    });
    
    describe('getEvents', () => {
        it('повинен повернути список всіх подій', () => {
            expect(eventBus.getEvents()).toEqual([]);
            
            eventBus.on('event1', () => {});
            eventBus.on('event2', () => {});
            
            const events = eventBus.getEvents();
            expect(events).toContain('event1');
            expect(events).toContain('event2');
            expect(events.length).toBe(2);
        });
    });
    
    describe('clear', () => {
        it('повинен очистити всі підписки', () => {
            eventBus.on('event1', () => {});
            eventBus.on('event2', () => {});
            
            eventBus.clear();
            
            expect(eventBus.getEvents()).toEqual([]);
        });
        
        it('повинен очистити конкретну подію', () => {
            eventBus.on('event1', () => {});
            eventBus.on('event2', () => {});
            
            eventBus.clear('event1');
            
            expect(eventBus.getEvents()).toEqual(['event2']);
        });
    });
    
    describe('getHistory', () => {
        it('повинен повернути історію подій', () => {
            eventBus.emit('event1', { data: 'test1' });
            eventBus.emit('event2', { data: 'test2' });
            
            const history = eventBus.getHistory();
            expect(history.length).toBe(2);
            expect(history[0].event).toBe('event1');
            expect(history[1].event).toBe('event2');
        });
        
        it('повинен обмежувати кількість подій', () => {
            for (let i = 0; i < 10; i++) {
                eventBus.emit('test-event', { index: i });
            }
            
            const history = eventBus.getHistory(5);
            expect(history.length).toBe(5);
        });
    });
    
    describe('clearHistory', () => {
        it('повинен очистити історію подій', () => {
            eventBus.emit('test-event', { data: 'test' });
            expect(eventBus.eventHistory.length).toBe(1);
            
            eventBus.clearHistory();
            expect(eventBus.eventHistory.length).toBe(0);
        });
    });
    
    describe('generateEventId', () => {
        it('повинен генерувати унікальні ID', () => {
            const id1 = eventBus.generateEventId();
            const id2 = eventBus.generateEventId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toContain('event_');
        });
    });
    
    describe('destroy', () => {
        it('повинен знищити EventBus', () => {
            eventBus.on('test-event', () => {});
            eventBus.use(() => {});
            eventBus.emit('test-event', { data: 'test' });
            
            eventBus.destroy();
            
            expect(eventBus.isDestroyed).toBe(true);
            expect(eventBus.listeners.size).toBe(0);
            expect(eventBus.middleware.length).toBe(0);
            expect(eventBus.eventHistory.length).toBe(0);
        });
    });
});

// Тестування глобального екземпляра
describe('Global EventBus', () => {
    it('повинен створити глобальний екземпляр', () => {
        expect(window.eventBus).toBeDefined();
        expect(window.eventBus instanceof EventBus).toBe(true);
    });
    
    it('повинен працювати як звичайний EventBus', () => {
        let called = false;
        
        window.eventBus.on('global-test', () => {
            called = true;
        });
        
        window.eventBus.emit('global-test');
        expect(called).toBe(true);
    });
});

// Запускаємо тести якщо файл виконано напряму
if (typeof window !== 'undefined' && window.currentTestRunner) {
    window.currentTestRunner.run().then(summary => {
        Logger.info('EventBus tests completed:', summary);
    }).catch(error => {
        Logger.error('EventBus tests failed:', error);
    });
} 