// === DOM UTILITIES ===
// Утиліти для роботи з DOM та подіями

export class DOMUtils {
    // Створення елементів
    static createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        
        if (className) {
            element.className = className;
        }
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        return element;
    }
    
    // Створення елемента з HTML
    static createFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstElementChild;
    }
    
    // Створення фрагмента з HTML
    static createFragment(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content;
    }
    
    // Безпечне встановлення innerHTML
    static setInnerHTML(element, html) {
        if (element) {
            element.innerHTML = html;
        }
    }
    
    // Безпечне встановлення textContent
    static setTextContent(element, text) {
        if (element) {
            element.textContent = text;
        }
    }
    
    // Додавання/видалення класів
    static addClass(element, ...classes) {
        if (element) {
            element.classList.add(...classes);
        }
    }
    
    static removeClass(element, ...classes) {
        if (element) {
            element.classList.remove(...classes);
        }
    }
    
    static toggleClass(element, className, force = null) {
        if (element) {
            element.classList.toggle(className, force);
        }
    }
    
    static hasClass(element, className) {
        return element && element.classList.contains(className);
    }
    
    // Показ/приховування елементів
    static show(element) {
        if (element) {
            element.classList.remove('hidden');
        }
    }
    
    static hide(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }
    
    static isVisible(element) {
        return element && !element.classList.contains('hidden');
    }
    
    // Робота з атрибутами
    static setAttribute(element, name, value) {
        if (element) {
            element.setAttribute(name, value);
        }
    }
    
    static getAttribute(element, name) {
        return element ? element.getAttribute(name) : null;
    }
    
    static removeAttribute(element, name) {
        if (element) {
            element.removeAttribute(name);
        }
    }
    
    // Робота з даними
    static setData(element, key, value) {
        if (element) {
            element.dataset[key] = value;
        }
    }
    
    static getData(element, key) {
        return element ? element.dataset[key] : null;
    }
    
    // Пошук елементів
    static find(selector, parent = document) {
        return parent.querySelector(selector);
    }
    
    static findAll(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }
    
    static findById(id) {
        return document.getElementById(id);
    }
    
    // Робота з формами
    static getFormData(form) {
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    static setFormData(form, data) {
        if (!form) return;
        
        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(value);
                } else {
                    input.value = value;
                }
            }
        });
    }
    
    // Валідація форм
    static validateForm(form, rules = {}) {
        const errors = {};
        const formData = this.getFormData(form);
        
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
            } else if (rule.custom && value) {
                const customError = rule.custom(value, formData);
                if (customError) {
                    errors[field] = customError;
                }
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    // Показ помилок валідації
    static showValidationErrors(form, errors) {
        // Видаляємо старі повідомлення про помилки
        form.querySelectorAll('.validation-error').forEach(el => el.remove());
        
        Object.entries(errors).forEach(([field, message]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'validation-error';
                errorDiv.textContent = message;
                errorDiv.style.cssText = `
                    color: #d32f2f;
                    font-size: 0.875rem;
                    margin-top: 4px;
                `;
                
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
                input.classList.add('error');
            }
        });
    }
    
    // Очищення помилок валідації
    static clearValidationErrors(form) {
        form.querySelectorAll('.validation-error').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
    
    // Анімації
    static animate(element, keyframes, options = {}) {
        if (!element) return Promise.resolve();
        
        return element.animate(keyframes, {
            duration: 300,
            easing: 'ease-in-out',
            ...options
        }).finished;
    }
    
    static fadeIn(element, duration = 300) {
        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }
    
    static fadeOut(element, duration = 300) {
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }
    
    static slideDown(element, duration = 300) {
        const height = element.scrollHeight;
        return this.animate(element, [
            { height: 0, opacity: 0 },
            { height: `${height}px`, opacity: 1 }
        ], { duration });
    }
    
    static slideUp(element, duration = 300) {
        const height = element.scrollHeight;
        return this.animate(element, [
            { height: `${height}px`, opacity: 1 },
            { height: 0, opacity: 0 }
        ], { duration });
    }
    
    static slideLeft(element, duration = 300) {
        const width = element.scrollWidth;
        return this.animate(element, [
            { width: 0, opacity: 0 },
            { width: `${width}px`, opacity: 1 }
        ], { duration });
    }
    
    static slideRight(element, duration = 300) {
        const width = element.scrollWidth;
        return this.animate(element, [
            { width: `${width}px`, opacity: 1 },
            { width: 0, opacity: 0 }
        ], { duration });
    }
    
    static bounce(element, duration = 600) {
        return this.animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], { duration });
    }
    
    static shake(element, duration = 500) {
        return this.animate(element, [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration });
    }
    
    static pulse(element, duration = 1000) {
        return this.animate(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], { duration, iterations: Infinity });
    }
    
    // Робота з подіями
    static on(element, event, selector, handler) {
        if (selector) {
            element.addEventListener(event, (e) => {
                if (e.target.matches(selector)) {
                    handler.call(e.target, e);
                }
            });
        } else {
            element.addEventListener(event, handler);
        }
    }
    
    static off(element, event, handler) {
        element.removeEventListener(event, handler);
    }
    
    static delegate(parent, event, selector, handler) {
        parent.addEventListener(event, (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        });
    }
    
    // Робота з розмірами та позиціями
    static getElementSize(element) {
        if (!element) return { width: 0, height: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }
    
    static getElementPosition(element) {
        if (!element) return { x: 0, y: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY
        };
    }
    
    static isElementInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Скролінг
    static scrollTo(element, options = {}) {
        if (!element) return;
        
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
            ...options
        });
    }
    
    static scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Робота з буфером обміну
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
    
    static async readFromClipboard() {
        try {
            return await navigator.clipboard.readText();
        } catch (error) {
            console.error('Failed to read from clipboard:', error);
            return '';
        }
    }
    
    // Робота з localStorage
    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }
    
    static getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }
    
    static removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }
    
    // Робота з URL параметрами
    static getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    static setUrlParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    }
    
    static removeUrlParam(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.replaceState({}, '', url);
    }
    
    // Робота з клавіатурою
    static onKeyPress(element, key, handler) {
        element.addEventListener('keydown', (e) => {
            if (e.key === key || e.code === key) {
                e.preventDefault();
                handler(e);
            }
        });
    }
    
    static onEscape(element, handler) {
        this.onKeyPress(element, 'Escape', handler);
    }
    
    static onEnter(element, handler) {
        this.onKeyPress(element, 'Enter', handler);
    }
    
    // Ловушка фокусу (для модальних вікон)
    static trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
        
        // Фокус на перший елемент
        if (firstElement) {
            firstElement.focus();
        }
    }
    
    // Створення модального вікна
    static createModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${options.title || ''}</h2>
                    <button class="modal-close" aria-label="Закрити">×</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer"></div>
            </div>
        `;
        
        return modal;
    }
    
    static showModal(modal) {
        document.body.appendChild(modal);
        this.addClass(modal, 'visible');
        this.trapFocus(modal.querySelector('.modal-content'));
    }
    
    static closeModal(modal) {
        this.removeClass(modal, 'visible');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    // Утиліти для роботи з зображеннями
    static preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    static lazyLoadImage(img, src) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = src;
                    observer.unobserve(img);
                }
            });
        });
        
        observer.observe(img);
    }
    
    // Утиліти для роботи з відео
    static playVideo(video) {
        return video.play().catch(error => {
            console.error('Failed to play video:', error);
        });
    }
    
    static pauseVideo(video) {
        video.pause();
    }
    
    // Утиліти для роботи з аудіо
    static playAudio(src) {
        const audio = new Audio(src);
        return audio.play().catch(error => {
            console.error('Failed to play audio:', error);
        });
    }
    
    // Утиліти для роботи з файлами
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Утиліти для роботи з датами
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
    
    static formatTime(date, format = 'HH:mm:ss') {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }
    
    // Утиліти для роботи з числами
    static formatNumber(number, options = {}) {
        return new Intl.NumberFormat(options.locale || 'uk-UA', options).format(number);
    }
    
    static formatCurrency(amount, currency = 'UAH', locale = 'uk-UA') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency
        }).format(amount);
    }
    
    // Утиліти для роботи з текстом
    static truncateText(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }
    
    static capitalizeFirst(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // Утиліти для роботи з масивами
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    static chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    // Утиліти для роботи з об'єктами
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }
    
    static mergeObjects(...objects) {
        return objects.reduce((result, obj) => {
            return { ...result, ...obj };
        }, {});
    }
    
    // Утиліти для роботи з колорами
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    static lightenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        
        const factor = 1 + percent / 100;
        const r = Math.min(255, Math.round(rgb.r * factor));
        const g = Math.min(255, Math.round(rgb.g * factor));
        const b = Math.min(255, Math.round(rgb.b * factor));
        
        return this.rgbToHex(r, g, b);
    }
    
    static darkenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        
        const factor = 1 - percent / 100;
        const r = Math.max(0, Math.round(rgb.r * factor));
        const g = Math.max(0, Math.round(rgb.g * factor));
        const b = Math.max(0, Math.round(rgb.b * factor));
        
        return this.rgbToHex(r, g, b);
    }
} 