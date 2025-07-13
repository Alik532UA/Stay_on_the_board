/**
 * Утиліта для оптимізації логування
 * @class LoggingOptimizer
 */
class LoggingOptimizer {
    static config = {
        // Компоненти, які потребують оптимізації
        componentsToOptimize: [
            'GameBoardComponent',
            'GameControlsComponent', 
            'MainMenuComponent',
            'LocalGameComponent',
            'SettingsComponent'
        ],
        
        // Патерни логів для видалення
        patternsToRemove: [
            /\[.*Component\] render:/,
            /\[.*Component\] bindEvents called/,
            /\[.*Component\] destroy/,
            /\[.*Component\] .* changed/,
            /\[.*Component\] .* called/,
            /\[.*Component\] .* set to/,
            /\[.*Component\] .* added/,
            /\[.*Component\] .* completed/,
            /\[.*Component\] .* processed/,
            /\[.*Component\] .* found/,
            /\[.*Component\] .* count:/,
            /\[.*Component\] .* length:/,
            /\[.*Component\] .* size:/,
            /\[.*Component\] .* created/,
            /\[.*Component\] .* updated/,
            /\[.*Component\] .* syncing/,
            /\[.*Component\] .* verification/,
            /\[.*Component\] .* mismatch/,
            /\[.*Component\] .* final/,
            /\[.*Component\] .* expected:/
        ],
        
        // Патерни логів для заміни на DEBUG
        patternsToDebug: [
            /\[.*Component\] .* initialized/,
            /\[.*Component\] .* starting/,
            /\[.*Component\] .* beginning/,
            /\[.*Component\] .* end/
        ],
        
        // Патерни логів для заміни на INFO
        patternsToInfo: [
            /\[.*Component\] .* error/,
            /\[.*Component\] .* failed/,
            /\[.*Component\] .* exception/,
            /\[.*Component\] .* critical/
        ]
    };
    
    /**
     * Оптимізує логування в компоненті
     * @param {Object} component - Компонент для оптимізації
     * @param {string} componentName - Назва компонента
     */
    static optimizeComponent(component, componentName) {
        if (!component || !componentName) {
            return;
        }
        
        // Замінюємо console.log на умовне логування
        this.replaceConsoleLogs(component, componentName);
        
        // Додаємо умовне логування для рендеру
        this.addConditionalRendering(component, componentName);
        
        // Додаємо умовне логування для подій
        this.addConditionalEvents(component, componentName);
        
        Logger.info(`Компонент ${componentName} оптимізовано`, {
            component: componentName,
            optimization: 'logging'
        });
    }
    
    /**
     * Замінює console.log на умовне логування
     * @param {Object} component - Компонент
     * @param {string} componentName - Назва компонента
     */
    static replaceConsoleLogs(component, componentName) {
        // Це заглушка - в реальному коді потрібно було б парсити код
        // і замінювати console.log на Logger.debug
        Logger.debug(`Заміна console.log в ${componentName}`, {
            component: componentName,
            method: 'replaceConsoleLogs'
        });
    }
    
    /**
     * Додає умовне логування для рендеру
     * @param {Object} component - Компонент
     * @param {string} componentName - Назва компонента
     */
    static addConditionalRendering(component, componentName) {
        if (component.render && typeof component.render === 'function') {
            const originalRender = component.render;
            
            component.render = function(...args) {
                // Логуємо тільки в режимі розробки
                if (Logger.config.isDevelopment) {
                    Logger.debug(`${componentName} render started`, {
                        component: componentName,
                        timestamp: Date.now()
                    });
                }
                
                const result = originalRender.apply(this, args);
                
                if (Logger.config.isDevelopment) {
                    Logger.debug(`${componentName} render completed`, {
                        component: componentName,
                        timestamp: Date.now()
                    });
                }
                
                return result;
            };
        }
    }
    
    /**
     * Додає умовне логування для подій
     * @param {Object} component - Компонент
     * @param {string} componentName - Назва компонента
     */
    static addConditionalEvents(component, componentName) {
        if (component.bindEvents && typeof component.bindEvents === 'function') {
            const originalBindEvents = component.bindEvents;
            
            component.bindEvents = function(...args) {
                // Логуємо тільки критичні події
                Logger.info(`${componentName} binding events`, {
                    component: componentName,
                    method: 'bindEvents'
                });
                
                return originalBindEvents.apply(this, args);
            };
        }
    }
    
    /**
     * Оптимізує всі компоненти
     */
    static optimizeAllComponents() {
        Logger.info('Початок оптимізації логування компонентів');
        
        // Знаходимо всі компоненти
        const components = this.findComponents();
        
        components.forEach(component => {
            this.optimizeComponent(component.instance, component.name);
        });
        
        Logger.info('Оптимізація логування компонентів завершена', {
            optimized: components.length
        });
    }
    
    /**
     * Знаходить всі компоненти в додатку
     * @returns {Array} Масив компонентів
     */
    static findComponents() {
        const components = [];
        
        // Шукаємо компоненти в глобальному об'єкті
        if (window.app && window.app.components) {
            Object.keys(window.app.components).forEach(name => {
                components.push({
                    name: name,
                    instance: window.app.components[name]
                });
            });
        }
        
        // Шукаємо компоненти в stateManager
        if (window.stateManager && window.stateManager.components) {
            Object.keys(window.stateManager.components).forEach(name => {
                components.push({
                    name: name,
                    instance: window.stateManager.components[name]
                });
            });
        }
        
        return components;
    }
    
    /**
     * Створює оптимізований логер для компонента
     * @param {string} componentName - Назва компонента
     * @returns {Object} Оптимізований логер
     */
    static createComponentLogger(componentName) {
        return {
            debug: (message, data = {}) => {
                if (Logger.config.isDevelopment) {
                    Logger.debug(`[${componentName}] ${message}`, data);
                }
            },
            
            info: (message, data = {}) => {
                Logger.info(`[${componentName}] ${message}`, data);
            },
            
            warn: (message, data = {}) => {
                Logger.warn(`[${componentName}] ${message}`, data);
            },
            
            error: (message, data = {}) => {
                Logger.error(`[${componentName}] ${message}`, data);
            },
            
            // Умовне логування для рендеру
            render: (message, data = {}) => {
                if (Logger.config.isDevelopment) {
                    Logger.debug(`[${componentName}] render: ${message}`, data);
                }
            },
            
            // Умовне логування для подій
            event: (message, data = {}) => {
                if (Logger.config.isDevelopment) {
                    Logger.debug(`[${componentName}] event: ${message}`, data);
                }
            },
            
            // Умовне логування для стану
            state: (message, data = {}) => {
                if (Logger.config.isDevelopment) {
                    Logger.debug(`[${componentName}] state: ${message}`, data);
                }
            }
        };
    }
    
    /**
     * Аналізує поточне логування
     * @returns {Object} Результат аналізу
     */
    static analyzeLogging() {
        const analysis = {
            totalLogs: 0,
            byComponent: {},
            byLevel: {},
            recommendations: []
        };
        
        // Аналізуємо логи Logger
        if (window.Logger) {
            const stats = Logger.getStats();
            analysis.totalLogs = stats.total;
            analysis.byLevel = stats.byLevel;
            analysis.byContext = stats.byContext;
        }
        
        // Аналізуємо console.log
        this.analyzeConsoleLogs(analysis);
        
        // Генеруємо рекомендації
        this.generateRecommendations(analysis);
        
        return analysis;
    }
    
    /**
     * Аналізує console.log виклики
     * @param {Object} analysis - Об'єкт аналізу
     */
    static analyzeConsoleLogs(analysis) {
        // Це заглушка - в реальному коді потрібно було б парсити код
        Logger.debug('Аналіз console.log викликів', {
            method: 'analyzeConsoleLogs'
        });
    }
    
    /**
     * Генерує рекомендації для оптимізації
     * @param {Object} analysis - Результат аналізу
     */
    static generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.totalLogs > 100) {
            recommendations.push('Зменшити кількість логів - забагато для продакшену');
        }
        
        if (analysis.byLevel.DEBUG > 50) {
            recommendations.push('DEBUG логи тільки для розробки - вимкнути в продакшені');
        }
        
        if (analysis.byLevel.INFO > 30) {
            recommendations.push('Зменшити INFO логи - залишити тільки критичні');
        }
        
        analysis.recommendations = recommendations;
    }
    
    /**
     * Застосовує рекомендації
     * @param {Array} recommendations - Рекомендації
     */
    static applyRecommendations(recommendations) {
        Logger.info('Застосування рекомендацій оптимізації', {
            count: recommendations.length
        });
        
        recommendations.forEach(recommendation => {
            Logger.info(`Застосовується: ${recommendation}`);
            
            if (recommendation.includes('DEBUG')) {
                Logger.configure({ level: 'INFO' });
            }
            
            if (recommendation.includes('продакшену')) {
                Logger.setProductionMode();
            }
        });
    }
}

// Експорт для використання
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoggingOptimizer;
} else {
    window.LoggingOptimizer = LoggingOptimizer;
} 