// === BASE COMPONENT ===
// Базовий клас для всіх UI компонентів

import { stateManager } from '../state-manager.js';

export class BaseComponent {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.subscriptions = [];
        this.eventListeners = new Map();
        this.isDestroyed = false;
        this.renderCount = 0;
        
        // Логування створення компонента
        this.log('Component created', { options });
        
        this.init();
    }
    
    init() {
        try {
            this.render();
            this.bindEvents();
            this.subscribeToState();
            this.log('Component initialized');
        } catch (error) {
            this.log('Error initializing component', { error });
            this.handleError(error);
        }
    }
    
    // Метод для рендерингу (має бути перевизначений в нащадках)
    render() {
        throw new Error('render() method must be implemented');
    }
    
    // Метод для прив'язки подій (має бути перевизначений в нащадках)
    bindEvents() {
        // Базова реалізація
    }
    
    // Метод для підписки на зміни стану (має бути перевизначений в нащадках)
    subscribeToState() {
        // Базова реалізація
    }
    
    // Утиліти для роботи з подіями
    addEventListener(selector, event, handler) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.set(`${selector}-${event}`, { element, event, handler });
            this.log('Event listener added successfully', { selector, event });
        } else {
            this.log('Element not found for event listener', { selector, event });
            console.error('[BaseComponent] Element not found:', selector, 'in element:', this.element);
        }
    }
    
    removeEventListener(selector, event) {
        const key = `${selector}-${event}`;
        const listener = this.eventListeners.get(key);
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
            this.eventListeners.delete(key);
        }
    }
    
    // Утиліти для роботи з підписками на стан
    subscribe(path, callback) {
        if (this.isDestroyed) return () => {};
        
        const unsubscribe = stateManager.subscribe(path, callback);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    
    // Утиліти для роботи з DOM
    setText(selector, text) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.textContent = text;
        } else {
            this.log('Element not found for setText', { selector });
        }
    }
    
    setHTML(selector, html) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.innerHTML = html;
        } else {
            this.log('Element not found for setHTML', { selector });
        }
    }
    
    setAttribute(selector, attribute, value) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.setAttribute(attribute, value);
        } else {
            this.log('Element not found for setAttribute', { selector, attribute });
        }
    }
    
    getAttribute(selector, attribute) {
        if (this.isDestroyed) return null;
        
        const element = this.element.querySelector(selector);
        return element ? element.getAttribute(attribute) : null;
    }
    
    addClass(selector, className) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.classList.add(className);
        } else {
            this.log('Element not found for addClass', { selector, className });
        }
    }
    
    removeClass(selector, className) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.classList.remove(className);
        } else {
            this.log('Element not found for removeClass', { selector, className });
        }
    }
    
    toggleClass(selector, className) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.classList.toggle(className);
        } else {
            this.log('Element not found for toggleClass', { selector, className });
        }
    }
    
    hasClass(selector, className) {
        if (this.isDestroyed) return false;
        
        const element = this.element.querySelector(selector);
        return element ? element.classList.contains(className) : false;
    }
    
    show(selector) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.classList.remove('hidden');
        } else {
            this.log('Element not found for show', { selector });
        }
    }
    
    hide(selector) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (element) {
            element.classList.add('hidden');
        } else {
            this.log('Element not found for hide', { selector });
        }
    }
    
    isVisible(selector) {
        if (this.isDestroyed) return false;
        
        const element = this.element.querySelector(selector);
        return element ? !element.classList.contains('hidden') : false;
    }
    
    // Утиліти для роботи з формами
    getFormData(formSelector) {
        if (this.isDestroyed) return {};
        
        const form = this.element.querySelector(formSelector);
        if (!form) {
            this.log('Form not found', { formSelector });
            return {};
        }
        
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    setFormData(formSelector, data) {
        if (this.isDestroyed) return;
        
        const form = this.element.querySelector(formSelector);
        if (!form) {
            this.log('Form not found for setFormData', { formSelector });
            return;
        }
        
        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(value);
                } else {
                    input.value = value;
                }
            } else {
                this.log('Form input not found', { formSelector, key });
            }
        });
    }
    
    // Валідація форм
    validateForm(formSelector, rules = {}) {
        if (this.isDestroyed) return { isValid: false, errors: {} };
        
        const form = this.element.querySelector(formSelector);
        if (!form) {
            this.log('Form not found for validation', { formSelector });
            return { isValid: false, errors: {} };
        }
        
        const errors = {};
        const formData = this.getFormData(formSelector);
        
        Object.entries(rules).forEach(([field, rule]) => {
            const value = formData[field];
            
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = rule.required;
            } else if (rule.pattern && value && !rule.pattern.test(value)) {
                errors[field] = rule.pattern;
            } else if (rule.minLength && value && value.length < rule.minLength) {
                errors[field] = rule.minLength;
            } else if (rule.maxLength && value && value.length > rule.maxLength) {
                errors[field] = rule.maxLength;
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    // Утиліти для роботи з перекладами
    async t(key, params = {}) {
        try {
            const { t } = await import('../localization.js');
            return t(key, params);
        } catch (error) {
            this.log('Error loading translation', { key, error });
            return key;
        }
    }
    
    // Утиліти для анімацій
    async animate(selector, keyframes, options = {}) {
        if (this.isDestroyed) return;
        
        const element = this.element.querySelector(selector);
        if (!element) {
            this.log('Element not found for animation', { selector });
            return;
        }
        
        try {
            const animation = element.animate(keyframes, {
                duration: 300,
                easing: 'ease-in-out',
                ...options
            });
            
            return animation.finished;
        } catch (error) {
            this.log('Animation error', { selector, error });
        }
    }
    
    async fadeIn(selector, duration = 300) {
        return this.animate(selector, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }
    
    async fadeOut(selector, duration = 300) {
        return this.animate(selector, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }
    
    // Утиліти для роботи з State Manager
    setState(path, value) {
        if (this.isDestroyed) return false;
        
        return stateManager.setState(path, value);
    }
    
    getState(path = null) {
        return stateManager.getState(path);
    }
    
    // Утиліти для логування
    log(message, data = {}) {
        const componentName = this.constructor.name;
        console.log(`[${componentName}] ${message}`, data);
    }
    
    warn(message, data = {}) {
        const componentName = this.constructor.name;
        console.warn(`[${componentName}] ${message}`, data);
    }
    
    error(message, data = {}) {
        const componentName = this.constructor.name;
        console.error(`[${componentName}] ${message}`, data);
    }
    
    // Обробка помилок
    handleError(error) {
        this.error('Component error', { error: error.message, stack: error.stack });
        
        // Можна додати додаткову логіку обробки помилок
        // Наприклад, показ повідомлення користувачу
        this.showErrorMessage(error.message);
    }
    
    showErrorMessage(message) {
        // Показуємо повідомлення про помилку користувачу
        if (this.element) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'component-error';
            errorDiv.textContent = `Помилка: ${message}`;
            errorDiv.style.cssText = `
                background: #ffebee;
                color: #c62828;
                padding: 10px;
                border: 1px solid #ef5350;
                border-radius: 4px;
                margin: 10px 0;
            `;
            
            this.element.appendChild(errorDiv);
            
            // Автоматично видаляємо через 5 секунд
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }
    
    // Метод для очищення ресурсів
    destroy() {
        if (this.isDestroyed) return;
        
        this.log('Destroying component');
        
        // Відписуємося від всіх підписок
        this.subscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                this.error('Error unsubscribing', { error });
            }
        });
        this.subscriptions = [];
        
        // Видаляємо всі обробники подій
        this.eventListeners.forEach((listener, key) => {
            try {
                listener.element.removeEventListener(listener.event, listener.handler);
            } catch (error) {
                this.error('Error removing event listener', { key, error });
            }
        });
        this.eventListeners.clear();
        
        // Видаляємо елемент з DOM
        if (this.element && this.element.parentNode) {
            try {
                this.element.parentNode.removeChild(this.element);
            } catch (error) {
                this.error('Error removing element from DOM', { error });
            }
        }
        
        this.isDestroyed = true;
        this.log('Component destroyed');
    }
    
    // Метод для оновлення компонента
    update(options = {}) {
        if (this.isDestroyed) return;
        
        this.log('Updating component', { options });
        
        try {
            this.options = { ...this.options, ...options };
            this.render();
            this.renderCount++;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Метод для перевірки стану компонента
    isAlive() {
        return !this.isDestroyed && this.element && this.element.parentNode;
    }
    
    // Метод для отримання статистики компонента
    getStats() {
        return {
            isDestroyed: this.isDestroyed,
            renderCount: this.renderCount,
            subscriptionsCount: this.subscriptions.length,
            eventListenersCount: this.eventListeners.size,
            isAlive: this.isAlive()
        };
    }
} 