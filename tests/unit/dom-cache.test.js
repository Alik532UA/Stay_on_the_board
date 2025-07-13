/**
 * Unit тести для DOMCache
 * @fileoverview Тестування системи кешування DOM елементів
 */

describe('DOMCache', () => {
    let domCache;
    let testContainer;
    
    beforeEach(() => {
        // Створюємо тестовий контейнер
        testContainer = document.createElement('div');
        testContainer.id = 'test-container';
        testContainer.innerHTML = `
            <div class="test-element" id="element1">Element 1</div>
            <div class="test-element" id="element2">Element 2</div>
            <div class="test-element" id="element3">Element 3</div>
            <div class="nested">
                <span class="inner-element">Inner</span>
            </div>
        `;
        document.body.appendChild(testContainer);
        
        // Створюємо новий екземпляр кешу
        domCache = new DOMCache({
            maxSize: 5,
            ttl: 1000, // 1 секунда для тестів
            autoCleanup: false
        });
    });
    
    afterEach(() => {
        // Очищуємо кеш
        if (domCache) {
            domCache.destroy();
        }
        
        // Видаляємо тестовий контейнер
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });
    
    describe('Конструктор', () => {
        it('повинен створити DOMCache з правильними налаштуваннями', () => {
            expect(domCache.cache).toBeDefined();
            expect(domCache.maxSize).toBe(5);
            expect(domCache.ttl).toBe(1000);
            expect(domCache.autoCleanup).toBe(false);
            expect(domCache.hits).toBe(0);
            expect(domCache.misses).toBe(0);
        });
        
        it('повинен використовувати значення за замовчуванням', () => {
            const defaultCache = new DOMCache();
            
            expect(defaultCache.maxSize).toBe(100);
            expect(defaultCache.ttl).toBe(5 * 60 * 1000);
            expect(defaultCache.autoCleanup).toBe(true);
            
            defaultCache.destroy();
        });
    });
    
    describe('get', () => {
        it('повинен знайти елемент в DOM і кешувати його', () => {
            const element = domCache.get('#element1', testContainer);
            
            expect(element).toBeDefined();
            expect(element.id).toBe('element1');
            expect(domCache.cache.size).toBe(1);
            expect(domCache.misses).toBe(1);
        });
        
        it('повинен повернути елемент з кешу при повторному запиті', () => {
            // Перший запит
            domCache.get('#element1', testContainer);
            
            // Другий запит
            const element = domCache.get('#element1', testContainer);
            
            expect(element).toBeDefined();
            expect(element.id).toBe('element1');
            expect(domCache.hits).toBe(1);
            expect(domCache.misses).toBe(1);
        });
        
        it('повинен повернути null для неіснуючого елемента', () => {
            const element = domCache.get('#nonexistent', testContainer);
            
            expect(element).toBeNull();
            expect(domCache.misses).toBe(1);
        });
        
        it('повинен використовувати document як контекст за замовчуванням', () => {
            const element = domCache.get('#test-container');
            
            expect(element).toBeDefined();
            expect(element.id).toBe('test-container');
        });
        
        it('повинен видалити застарілий елемент з кешу', () => {
            // Додаємо елемент в кеш
            domCache.get('#element1', testContainer);
            
            // Симулюємо застарілість
            const cacheEntry = domCache.cache.values().next().value;
            cacheEntry.timestamp = Date.now() - 2000; // 2 секунди тому
            
            // Повторний запит
            domCache.get('#element1', testContainer);
            
            expect(domCache.misses).toBe(2); // Обидва запити стали промахами
        });
        
        it('повинен видалити невалідний елемент з кешу', () => {
            // Додаємо елемент в кеш
            domCache.get('#element1', testContainer);
            
            // Видаляємо елемент з DOM
            const element = testContainer.querySelector('#element1');
            element.remove();
            
            // Повторний запит
            domCache.get('#element1', testContainer);
            
            expect(domCache.misses).toBe(2);
        });
    });
    
    describe('getAll', () => {
        it('повинен знайти всі елементи і кешувати їх', () => {
            const elements = domCache.getAll('.test-element', testContainer);
            
            expect(elements.length).toBe(3);
            expect(domCache.cache.size).toBe(1);
            expect(domCache.misses).toBe(1);
        });
        
        it('повинен повернути елементи з кешу при повторному запиті', () => {
            // Перший запит
            domCache.getAll('.test-element', testContainer);
            
            // Другий запит
            const elements = domCache.getAll('.test-element', testContainer);
            
            expect(elements.length).toBe(3);
            expect(domCache.hits).toBe(1);
        });
        
        it('повинен повернути порожній NodeList для неіснуючих елементів', () => {
            const elements = domCache.getAll('.nonexistent', testContainer);
            
            expect(elements.length).toBe(0);
            expect(domCache.misses).toBe(1);
        });
    });
    
    describe('set', () => {
        it('повинен додати елемент в кеш', () => {
            const element = testContainer.querySelector('#element1');
            domCache.set('test-key', element);
            
            expect(domCache.cache.has('test-key')).toBe(true);
            expect(domCache.cache.get('test-key').element).toBe(element);
        });
        
        it('повинен додати NodeList в кеш', () => {
            const elements = testContainer.querySelectorAll('.test-element');
            domCache.set('test-key', elements, true);
            
            expect(domCache.cache.has('test-key')).toBe(true);
            expect(domCache.cache.get('test-key').elements).toBe(elements);
        });
        
        it('повинен видалити найстаріший елемент при переповненні', () => {
            // Заповнюємо кеш
            for (let i = 0; i < 6; i++) {
                const element = testContainer.querySelector('#element1');
                domCache.set(`key${i}`, element);
            }
            
            expect(domCache.cache.size).toBe(5); // maxSize
            expect(domCache.cache.has('key0')).toBe(false); // Найстаріший видалений
        });
    });
    
    describe('delete', () => {
        it('повинен видалити елемент з кешу', () => {
            domCache.get('#element1', testContainer);
            expect(domCache.cache.size).toBe(1);
            
            domCache.delete('#element1', testContainer);
            expect(domCache.cache.size).toBe(0);
        });
        
        it('повинен обробляти видалення неіснуючого ключа', () => {
            expect(() => {
                domCache.delete('#nonexistent', testContainer);
            }).not.toThrow();
        });
    });
    
    describe('clear', () => {
        it('повинен очистити весь кеш', () => {
            domCache.get('#element1', testContainer);
            domCache.get('#element2', testContainer);
            
            expect(domCache.cache.size).toBe(2);
            
            domCache.clear();
            
            expect(domCache.cache.size).toBe(0);
            expect(domCache.hits).toBe(0);
            expect(domCache.misses).toBe(0);
        });
    });
    
    describe('cleanup', () => {
        it('повинен видалити застарілі елементи', () => {
            // Додаємо елементи з різним часом
            const element1 = testContainer.querySelector('#element1');
            const element2 = testContainer.querySelector('#element2');
            
            domCache.set('key1', element1);
            domCache.set('key2', element2);
            
            // Робимо перший елемент застарілим
            const entry1 = domCache.cache.get('key1');
            entry1.timestamp = Date.now() - 2000;
            
            domCache.cleanup();
            
            expect(domCache.cache.has('key1')).toBe(false);
            expect(domCache.cache.has('key2')).toBe(true);
        });
    });
    
    describe('Автоматичне очищення', () => {
        it('повинен запустити автоматичне очищення', () => {
            const autoCache = new DOMCache({
                autoCleanup: true,
                cleanupInterval: 100
            });
            
            expect(autoCache.cleanupTimer).toBeDefined();
            
            autoCache.destroy();
        });
        
        it('повинен зупинити автоматичне очищення', () => {
            const autoCache = new DOMCache({
                autoCleanup: true,
                cleanupInterval: 100
            });
            
            autoCache.stopAutoCleanup();
            expect(autoCache.cleanupTimer).toBeNull();
            
            autoCache.destroy();
        });
    });
    
    describe('evictOldest', () => {
        it('повинен видалити найстаріший елемент', () => {
            // Додаємо елементи з різним часом
            const element1 = testContainer.querySelector('#element1');
            const element2 = testContainer.querySelector('#element2');
            
            domCache.set('key1', element1);
            domCache.set('key2', element2);
            
            // Робимо перший елемент старішим
            const entry1 = domCache.cache.get('key1');
            entry1.timestamp = Date.now() - 1000;
            
            // Додаємо ще один елемент, щоб переповнити кеш
            const element3 = testContainer.querySelector('#element3');
            domCache.set('key3', element3);
            domCache.set('key4', element3);
            domCache.set('key5', element3);
            domCache.set('key6', element3); // Це викличе evictOldest
            
            expect(domCache.cache.has('key1')).toBe(false); // Найстаріший видалений
            expect(domCache.cache.has('key2')).toBe(true);
        });
    });
    
    describe('getCacheKey', () => {
        it('повинен генерувати унікальні ключі', () => {
            const key1 = domCache.getCacheKey('#element1', testContainer);
            const key2 = domCache.getCacheKey('#element1', document);
            const key3 = domCache.getCacheKey('#element1', testContainer, 'suffix');
            
            expect(key1).not.toBe(key2);
            expect(key1).not.toBe(key3);
            expect(key1).toContain('element1');
            expect(key1).toContain('test-container');
        });
    });
    
    describe('isElementValid', () => {
        it('повинен перевірити валідність елемента', () => {
            const element = testContainer.querySelector('#element1');
            expect(domCache.isElementValid(element)).toBe(true);
            
            expect(domCache.isElementValid(null)).toBe(false);
            expect(domCache.isElementValid(undefined)).toBe(false);
            
            // Створюємо елемент, який не в DOM
            const detachedElement = document.createElement('div');
            expect(domCache.isElementValid(detachedElement)).toBe(false);
        });
    });
    
    describe('areElementsValid', () => {
        it('повинен перевірити валідність NodeList', () => {
            const elements = testContainer.querySelectorAll('.test-element');
            expect(domCache.areElementsValid(elements)).toBe(true);
            
            expect(domCache.areElementsValid(null)).toBe(false);
            expect(domCache.areElementsValid([])).toBe(false);
            
            // Створюємо NodeList з невалідним елементом
            const invalidElements = document.querySelectorAll('.nonexistent');
            expect(domCache.areElementsValid(invalidElements)).toBe(false);
        });
    });
    
    describe('getStats', () => {
        it('повинен повернути статистику кешу', () => {
            // Робимо кілька запитів
            domCache.get('#element1', testContainer); // miss
            domCache.get('#element1', testContainer); // hit
            domCache.get('#element2', testContainer); // miss
            domCache.get('#element2', testContainer); // hit
            domCache.get('#nonexistent', testContainer); // miss
            
            const stats = domCache.getStats();
            
            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBe(5);
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(3);
            expect(stats.hitRate).toBe(40); // 2/5 * 100
            expect(stats.ttl).toBe(1000);
            expect(stats.popularElements).toBeDefined();
        });
        
        it('повинен обчислити правильний відсоток попадань', () => {
            // Тільки промахи
            domCache.get('#nonexistent1', testContainer);
            domCache.get('#nonexistent2', testContainer);
            
            const stats = domCache.getStats();
            expect(stats.hitRate).toBe(0);
            
            // Тільки попадання
            domCache.get('#element1', testContainer);
            domCache.get('#element1', testContainer);
            
            const stats2 = domCache.getStats();
            expect(stats2.hitRate).toBe(50); // 1/2 * 100
        });
    });
    
    describe('getSize', () => {
        it('повинен обчислити приблизний розмір кешу', () => {
            domCache.get('#element1', testContainer);
            domCache.get('#element2', testContainer);
            
            const size = domCache.getSize();
            expect(typeof size).toBe('number');
            expect(size).toBeGreaterThan(0);
        });
    });
    
    describe('destroy', () => {
        it('повинен знищити кеш', () => {
            domCache.get('#element1', testContainer);
            
            domCache.destroy();
            
            expect(domCache.cache.size).toBe(0);
            expect(domCache.cleanupTimer).toBeNull();
        });
    });
});

// Тестування глобального екземпляра
describe('Global DOMCache', () => {
    it('повинен створити глобальний екземпляр', () => {
        expect(window.domCache).toBeDefined();
        expect(window.domCache instanceof DOMCache).toBe(true);
    });
    
    it('повинен працювати як звичайний DOMCache', () => {
        const testDiv = document.createElement('div');
        testDiv.id = 'global-test';
        document.body.appendChild(testDiv);
        
        const element = window.domCache.get('#global-test');
        expect(element).toBeDefined();
        expect(element.id).toBe('global-test');
        
        document.body.removeChild(testDiv);
    });
});

// Запускаємо тести якщо файл виконано напряму
if (typeof window !== 'undefined' && window.currentTestRunner) {
    window.currentTestRunner.run().then(summary => {
        console.log('DOMCache tests completed:', summary);
    }).catch(error => {
        console.error('DOMCache tests failed:', error);
    });
} 