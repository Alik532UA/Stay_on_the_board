/**
 * Unit тести для StateManager
 * @fileoverview Тестування основної функціональності StateManager
 */

// Підключаємо необхідні файли
// В реальному проекті це було б через модулі
// Тут використовуємо глобальні змінні

describe('StateManager', () => {
    let stateManager;
    
    beforeEach(() => {
        // Створюємо новий екземпляр для кожного тесту
        stateManager = new StateManager();
    });
    
    afterEach(() => {
        // Очищуємо localStorage
        localStorage.clear();
        if (stateManager) {
            stateManager.destroy();
        }
    });
    
    describe('Конструктор', () => {
        it('повинен створити StateManager з початковим станом', () => {
            expect(stateManager).toBeDefined();
            expect(stateManager.state).toBeDefined();
            expect(stateManager.state.settings).toBeDefined();
            expect(stateManager.state.game).toBeDefined();
            expect(stateManager.state.ui).toBeDefined();
        });
        
        it('повинен завантажити налаштування з localStorage', () => {
            localStorage.setItem('lang', 'en');
            localStorage.setItem('theme', 'light');
            
            const newStateManager = new StateManager();
            expect(newStateManager.getState('settings.language')).toBe('en');
            expect(newStateManager.getState('settings.theme')).toBe('light');
        });
    });
    
    describe('getState', () => {
        it('повинен повернути весь стан якщо шлях не вказано', () => {
            const state = stateManager.getState();
            expect(state).toEqual(stateManager.state);
        });
        
        it('повинен повернути значення за шляхом', () => {
            const language = stateManager.getState('settings.language');
            expect(language).toBe('uk');
        });
        
        it('повинен повернути undefined для неіснуючого шляху', () => {
            const value = stateManager.getState('settings.nonexistent');
            expect(value).toBeUndefined();
        });
        
        it('повинен повернути undefined для глибокого неіснуючого шляху', () => {
            const value = stateManager.getState('settings.deeply.nested.property');
            expect(value).toBeUndefined();
        });
    });
    
    describe('setState', () => {
        it('повинен встановити значення за шляхом', () => {
            const result = stateManager.setState('settings.language', 'en');
            expect(result).toBe(true);
            expect(stateManager.getState('settings.language')).toBe('en');
        });
        
        it('повинен створити вкладені об\'єкти якщо не існують', () => {
            stateManager.setState('custom.deeply.nested', 'value');
            expect(stateManager.getState('custom.deeply.nested')).toBe('value');
        });
        
        it('повинен зберегти налаштування в localStorage', () => {
            stateManager.setState('settings.language', 'en');
            expect(localStorage.getItem('language')).toBe('"en"');
        });
        
        it('повинен повернути false для невалідного значення', () => {
            const result = stateManager.setState('game.currentPlayer', 3);
            expect(result).toBe(false);
            expect(stateManager.getState('game.currentPlayer')).toBe(1);
        });
        
        it('повинен сповістити підписників про зміни', () => {
            let notified = false;
            let newValue = null;
            let oldValue = null;
            
            stateManager.subscribe('settings.language', (value, oldVal) => {
                notified = true;
                newValue = value;
                oldValue = oldVal;
            });
            
            stateManager.setState('settings.language', 'en');
            
            expect(notified).toBe(true);
            expect(newValue).toBe('en');
            expect(oldValue).toBe('uk');
        });
    });
    
    describe('validateValue', () => {
        it('повинен валідувати currentPlayer', () => {
            expect(stateManager.validateValue('game.currentPlayer', 1)).toBe(true);
            expect(stateManager.validateValue('game.currentPlayer', 2)).toBe(true);
            expect(stateManager.validateValue('game.currentPlayer', 3)).toBe(false);
            expect(stateManager.validateValue('game.currentPlayer', 0)).toBe(false);
        });
        
        it('повинен валідувати boardSize', () => {
            expect(stateManager.validateValue('game.boardSize', 3)).toBe(true);
            expect(stateManager.validateValue('game.boardSize', 5)).toBe(true);
            expect(stateManager.validateValue('game.boardSize', 10)).toBe(true);
            expect(stateManager.validateValue('game.boardSize', 2)).toBe(false);
            expect(stateManager.validateValue('game.boardSize', 11)).toBe(false);
        });
        
        it('повинен валідувати language', () => {
            expect(stateManager.validateValue('settings.language', 'uk')).toBe(true);
            expect(stateManager.validateValue('settings.language', 'en')).toBe(true);
            expect(stateManager.validateValue('settings.language', 'crh')).toBe(true);
            expect(stateManager.validateValue('settings.language', 'nl')).toBe(true);
            expect(stateManager.validateValue('settings.language', 'fr')).toBe(false);
        });
        
        it('повинен валідувати theme', () => {
            expect(stateManager.validateValue('settings.theme', 'light')).toBe(true);
            expect(stateManager.validateValue('settings.theme', 'dark')).toBe(true);
            expect(stateManager.validateValue('settings.theme', 'blue')).toBe(false);
        });
        
        it('повинен валідувати style', () => {
            expect(stateManager.validateValue('settings.style', 'classic')).toBe(true);
            expect(stateManager.validateValue('settings.style', 'peak')).toBe(true);
            expect(stateManager.validateValue('settings.style', 'cs2')).toBe(true);
            expect(stateManager.validateValue('settings.style', 'glass')).toBe(true);
            expect(stateManager.validateValue('settings.style', 'material')).toBe(true);
            expect(stateManager.validateValue('settings.style', 'custom')).toBe(false);
        });
    });
    
    describe('subscribe', () => {
        it('повинен підписатися на зміни', () => {
            let called = false;
            const unsubscribe = stateManager.subscribe('settings.language', () => {
                called = true;
            });
            
            stateManager.setState('settings.language', 'en');
            expect(called).toBe(true);
        });
        
        it('повинен повернути функцію відписки', () => {
            let called = false;
            const unsubscribe = stateManager.subscribe('settings.language', () => {
                called = true;
            });
            
            expect(typeof unsubscribe).toBe('function');
            
            unsubscribe();
            stateManager.setState('settings.language', 'en');
            expect(called).toBe(false);
        });
        
        it('повинен підписатися на кілька підписників', () => {
            let callCount = 0;
            
            stateManager.subscribe('settings.language', () => { callCount++; });
            stateManager.subscribe('settings.language', () => { callCount++; });
            
            stateManager.setState('settings.language', 'en');
            expect(callCount).toBe(2);
        });
    });
    
    describe('undo/redo', () => {
        it('повинен зберігати історію змін', () => {
            stateManager.setState('settings.language', 'en');
            stateManager.setState('settings.theme', 'light');
            
            expect(stateManager.getState('settings.language')).toBe('en');
            expect(stateManager.getState('settings.theme')).toBe('light');
        });
        
        it('повинен виконувати undo', () => {
            stateManager.setState('settings.language', 'en');
            stateManager.setState('settings.theme', 'light');
            
            stateManager.undo();
            expect(stateManager.getState('settings.theme')).toBe('dark');
            
            stateManager.undo();
            expect(stateManager.getState('settings.language')).toBe('uk');
        });
        
        it('повинен виконувати redo', () => {
            stateManager.setState('settings.language', 'en');
            stateManager.setState('settings.theme', 'light');
            
            stateManager.undo();
            stateManager.undo();
            
            stateManager.redo();
            expect(stateManager.getState('settings.language')).toBe('en');
            
            stateManager.redo();
            expect(stateManager.getState('settings.theme')).toBe('light');
        });
        
        it('повинен обмежувати розмір історії', () => {
            // Додаємо більше змін ніж maxHistorySize
            for (let i = 0; i < 60; i++) {
                stateManager.setState('settings.language', `lang${i}`);
            }
            
            // Перевіряємо що історія не перевищила ліміт
            expect(stateManager.history.length).toBeLessThanOrEqual(stateManager.maxHistorySize);
        });
    });
    
    describe('updateSettings', () => {
        it('повинен оновити кілька налаштувань одночасно', () => {
            const newSettings = {
                language: 'en',
                theme: 'light',
                style: 'material'
            };
            
            stateManager.updateSettings(newSettings);
            
            expect(stateManager.getState('settings.language')).toBe('en');
            expect(stateManager.getState('settings.theme')).toBe('light');
            expect(stateManager.getState('settings.style')).toBe('material');
        });
    });
    
    describe('showModal/hideModal', () => {
        it('повинен показати модальне вікно', () => {
            stateManager.showModal('Test Title', 'Test Content', [
                { text: 'OK', action: 'ok' }
            ]);
            
            const modal = stateManager.getState('ui.modal');
            expect(modal.isOpen).toBe(true);
            expect(modal.title).toBe('Test Title');
            expect(modal.content).toBe('Test Content');
            expect(modal.buttons).toHaveLength(1);
        });
        
        it('повинен приховати модальне вікно', () => {
            stateManager.showModal('Test', 'Content');
            stateManager.hideModal();
            
            const modal = stateManager.getState('ui.modal');
            expect(modal.isOpen).toBe(false);
        });
    });
    
    describe('navigateTo', () => {
        it('повинен змінити поточний view', () => {
            stateManager.navigateTo('settings');
            expect(stateManager.getState('ui.currentView')).toBe('settings');
            
            stateManager.navigateTo('game');
            expect(stateManager.getState('ui.currentView')).toBe('game');
        });
    });
    
    describe('exportState/importState', () => {
        it('повинен експортувати стан', () => {
            stateManager.setState('settings.language', 'en');
            const exported = stateManager.exportState();
            
            expect(exported).toContain('"language":"en"');
            expect(exported).toContain('"settings"');
            expect(exported).toContain('"game"');
            expect(exported).toContain('"ui"');
        });
        
        it('повинен імпортувати стан', () => {
            const testState = {
                settings: { language: 'en', theme: 'light' },
                game: { isActive: true, currentPlayer: 2 },
                ui: { currentView: 'game' }
            };
            
            const result = stateManager.importState(JSON.stringify(testState));
            expect(result).toBe(true);
            
            expect(stateManager.getState('settings.language')).toBe('en');
            expect(stateManager.getState('game.isActive')).toBe(true);
            expect(stateManager.getState('ui.currentView')).toBe('game');
        });
        
        it('повинен повернути false для невалідного JSON', () => {
            const result = stateManager.importState('invalid json');
            expect(result).toBe(false);
        });
    });
    
    describe('destroy', () => {
        it('повинен очистити ресурси', () => {
            stateManager.subscribe('settings.language', () => {});
            
            stateManager.destroy();
            
            expect(stateManager.subscribers.size).toBe(0);
            expect(stateManager.history).toHaveLength(0);
        });
    });
    
    describe('confirmMove', () => {
        it('повинен встановити moveConfirmed в true і негайно скинути в false', () => {
            // Встановлюємо необхідні стани для підтвердження ходу
            stateManager.setState('game.selectedDirection', 'north');
            stateManager.setState('game.selectedDistance', 1);
            
            let moveConfirmedValues = [];
            stateManager.subscribe('game.moveConfirmed', (value) => {
                moveConfirmedValues.push(value);
            });
            
            // Викликаємо confirmMove
            stateManager.confirmMove();
            
            // Перевіряємо що moveConfirmed було встановлено в true, а потім в false
            expect(moveConfirmedValues).toEqual([true, false]);
        });
        
        it('повинен показувати помилку якщо напрямок або дистанція не вибрані', () => {
            // Не встановлюємо selectedDirection та selectedDistance
            
            let modalShown = false;
            const originalShowModal = stateManager.showModal;
            stateManager.showModal = (title, content, buttons) => {
                modalShown = true;
                expect(title).toBe('Помилка');
                expect(content).toBe('Оберіть напрямок та відстань');
            };
            
            stateManager.confirmMove();
            
            expect(modalShown).toBe(true);
            
            // Відновлюємо оригінальний метод
            stateManager.showModal = originalShowModal;
        });
        
        it('повинен працювати кілька разів поспіль', () => {
            // Встановлюємо необхідні стани
            stateManager.setState('game.selectedDirection', 'north');
            stateManager.setState('game.selectedDistance', 1);
            
            let callCount = 0;
            stateManager.subscribe('game.moveConfirmed', (value) => {
                if (value === true) {
                    callCount++;
                }
            });
            
            // Викликаємо confirmMove кілька разів
            stateManager.confirmMove();
            stateManager.confirmMove();
            stateManager.confirmMove();
            
            // Перевіряємо що кожен виклик спрацював
            expect(callCount).toBe(3);
        });
    });
});

// Запускаємо тести якщо файл виконано напряму
if (typeof window !== 'undefined' && window.currentTestRunner) {
    window.currentTestRunner.run().then(summary => {
        console.log('StateManager tests completed:', summary);
    }).catch(error => {
        console.error('StateManager tests failed:', error);
    });
} 