/**
 * Система валідації для перевірки даних та форм
 * @class Validator
 */
class Validator {
    constructor() {
        this.rules = new Map();
        this.customValidators = new Map();
        this.messages = new Map();
        
        this.initDefaultRules();
        this.initDefaultMessages();
    }
    
    /**
     * Ініціалізує стандартні правила валідації
     */
    initDefaultRules() {
        // Правила для рядків
        this.addRule('required', (value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return true;
        });
        
        this.addRule('minLength', (value, min) => {
            if (typeof value !== 'string') return true;
            return value.length >= min;
        });
        
        this.addRule('maxLength', (value, max) => {
            if (typeof value !== 'string') return true;
            return value.length <= max;
        });
        
        this.addRule('email', (value) => {
            if (typeof value !== 'string') return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        });
        
        this.addRule('url', (value) => {
            if (typeof value !== 'string') return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });
        
        this.addRule('pattern', (value, pattern) => {
            if (typeof value !== 'string') return true;
            const regex = new RegExp(pattern);
            return regex.test(value);
        });
        
        // Правила для чисел
        this.addRule('min', (value, min) => {
            const num = Number(value);
            return !isNaN(num) && num >= min;
        });
        
        this.addRule('max', (value, max) => {
            const num = Number(value);
            return !isNaN(num) && num <= max;
        });
        
        this.addRule('range', (value, min, max) => {
            const num = Number(value);
            return !isNaN(num) && num >= min && num <= max;
        });
        
        this.addRule('integer', (value) => {
            const num = Number(value);
            return !isNaN(num) && Number.isInteger(num);
        });
        
        this.addRule('positive', (value) => {
            const num = Number(value);
            return !isNaN(num) && num > 0;
        });
        
        this.addRule('negative', (value) => {
            const num = Number(value);
            return !isNaN(num) && num < 0;
        });
        
        // Правила для масивів
        this.addRule('minItems', (value, min) => {
            if (!Array.isArray(value)) return true;
            return value.length >= min;
        });
        
        this.addRule('maxItems', (value, max) => {
            if (!Array.isArray(value)) return true;
            return value.length <= max;
        });
        
        this.addRule('unique', (value) => {
            if (!Array.isArray(value)) return true;
            return new Set(value).size === value.length;
        });
        
        // Правила для об'єктів
        this.addRule('hasKeys', (value, keys) => {
            if (typeof value !== 'object' || value === null) return false;
            return keys.every(key => key in value);
        });
        
        this.addRule('hasValues', (value, values) => {
            if (typeof value !== 'object' || value === null) return false;
            return values.every(val => Object.values(value).includes(val));
        });
        
        // Правила для дат
        this.addRule('date', (value) => {
            if (value instanceof Date) return true;
            if (typeof value === 'string') {
                const date = new Date(value);
                return !isNaN(date.getTime());
            }
            return false;
        });
        
        this.addRule('future', (value) => {
            const date = value instanceof Date ? value : new Date(value);
            return date > new Date();
        });
        
        this.addRule('past', (value) => {
            const date = value instanceof Date ? value : new Date(value);
            return date < new Date();
        });
        
        // Правила для файлів
        this.addRule('fileSize', (value, maxSize) => {
            if (!(value instanceof File)) return true;
            return value.size <= maxSize;
        });
        
        this.addRule('fileType', (value, allowedTypes) => {
            if (!(value instanceof File)) return true;
            return allowedTypes.includes(value.type);
        });
        
        // Правила для ігрової логіки
        this.addRule('boardSize', (value) => {
            const size = Number(value);
            return !isNaN(size) && size >= 3 && size <= 10;
        });
        
        this.addRule('playerNumber', (value) => {
            const player = Number(value);
            return !isNaN(player) && (player === 1 || player === 2);
        });
        
        this.addRule('validMove', (value) => {
            if (!value || typeof value !== 'object') return false;
            return 'row' in value && 'col' in value && 
                   Number.isInteger(value.row) && Number.isInteger(value.col) &&
                   value.row >= 0 && value.col >= 0;
        });
        
        this.addRule('gameMode', (value) => {
            const validModes = ['vsComputer', 'localTwoPlayer', 'online'];
            return validModes.includes(value);
        });
        
        this.addRule('language', (value) => {
            const validLanguages = ['uk', 'en', 'nl', 'crh'];
            return validLanguages.includes(value);
        });
        
        this.addRule('theme', (value) => {
            const validThemes = ['light', 'dark'];
            return validThemes.includes(value);
        });
        
        this.addRule('style', (value) => {
            const validStyles = ['classic', 'peak', 'cs2', 'glass', 'material'];
            return validStyles.includes(value);
        });
    }
    
    /**
     * Ініціалізує стандартні повідомлення про помилки
     */
    initDefaultMessages() {
        this.setMessage('required', 'Це поле є обов\'язковим');
        this.setMessage('minLength', 'Мінімальна довжина: {0} символів');
        this.setMessage('maxLength', 'Максимальна довжина: {0} символів');
        this.setMessage('email', 'Невірний формат email');
        this.setMessage('url', 'Невірний формат URL');
        this.setMessage('pattern', 'Значення не відповідає шаблону');
        this.setMessage('min', 'Мінімальне значення: {0}');
        this.setMessage('max', 'Максимальне значення: {0}');
        this.setMessage('range', 'Значення повинно бути між {0} та {1}');
        this.setMessage('integer', 'Значення повинно бути цілим числом');
        this.setMessage('positive', 'Значення повинно бути додатнім');
        this.setMessage('negative', 'Значення повинно бути від\'ємним');
        this.setMessage('minItems', 'Мінімальна кількість елементів: {0}');
        this.setMessage('maxItems', 'Максимальна кількість елементів: {0}');
        this.setMessage('unique', 'Всі елементи повинні бути унікальними');
        this.setMessage('hasKeys', 'Об\'єкт повинен містити ключі: {0}');
        this.setMessage('hasValues', 'Об\'єкт повинен містити значення: {0}');
        this.setMessage('date', 'Невірний формат дати');
        this.setMessage('future', 'Дата повинна бути в майбутньому');
        this.setMessage('past', 'Дата повинна бути в минулому');
        this.setMessage('fileSize', 'Розмір файлу не повинен перевищувати {0} байт');
        this.setMessage('fileType', 'Непідтримуваний тип файлу');
        this.setMessage('boardSize', 'Розмір дошки повинен бути від 3 до 10');
        this.setMessage('playerNumber', 'Номер гравця повинен бути 1 або 2');
        this.setMessage('validMove', 'Невірний формат ходу');
        this.setMessage('gameMode', 'Невірний режим гри');
        this.setMessage('language', 'Непідтримувана мова');
        this.setMessage('theme', 'Невірна тема');
        this.setMessage('style', 'Невірний стиль');
    }
    
    /**
     * Додає правило валідації
     * @param {string} name - Назва правила
     * @param {Function} validator - Функція валідації
     */
    addRule(name, validator) {
        this.rules.set(name, validator);
    }
    
    /**
     * Додає кастомний валідатор
     * @param {string} name - Назва валідатора
     * @param {Function} validator - Функція валідації
     */
    addCustomValidator(name, validator) {
        this.customValidators.set(name, validator);
    }
    
    /**
     * Встановлює повідомлення про помилку
     * @param {string} rule - Назва правила
     * @param {string} message - Повідомлення
     */
    setMessage(rule, message) {
        this.messages.set(rule, message);
    }
    
    /**
     * Валідує значення за правилом
     * @param {*} value - Значення для валідації
     * @param {string} rule - Назва правила
     * @param {...*} params - Параметри правила
     * @returns {boolean} Результат валідації
     */
    validate(value, rule, ...params) {
        const validator = this.rules.get(rule) || this.customValidators.get(rule);
        
        if (!validator) {
            throw new Error(`Unknown validation rule: ${rule}`);
        }
        
        return validator(value, ...params);
    }
    
    /**
     * Валідує значення за набором правил
     * @param {*} value - Значення для валідації
     * @param {Array|Object} rules - Правила валідації
     * @returns {ValidationResult} Результат валідації
     */
    validateValue(value, rules) {
        const errors = [];
        
        if (Array.isArray(rules)) {
            // Простий масив правил
            for (const rule of rules) {
                if (!this.validate(value, rule)) {
                    errors.push(this.getMessage(rule));
                }
            }
        } else if (typeof rules === 'object') {
            // Об'єкт з правилами та параметрами
            for (const [rule, params] of Object.entries(rules)) {
                const ruleParams = Array.isArray(params) ? params : [params];
                if (!this.validate(value, rule, ...ruleParams)) {
                    errors.push(this.getMessage(rule, ...ruleParams));
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Валідує об'єкт за схемою
     * @param {Object} data - Дані для валідації
     * @param {Object} schema - Схема валідації
     * @returns {ValidationResult} Результат валідації
     */
    validateObject(data, schema) {
        const errors = {};
        let isValid = true;
        
        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];
            const result = this.validateValue(value, rules);
            
            if (!result.isValid) {
                errors[field] = result.errors;
                isValid = false;
            }
        }
        
        return {
            isValid,
            errors
        };
    }
    
    /**
     * Валідує форму
     * @param {HTMLFormElement} form - Форма для валідації
     * @param {Object} schema - Схема валідації
     * @returns {ValidationResult} Результат валідації
     */
    validateForm(form, schema) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [name, value] of formData.entries()) {
            data[name] = value;
        }
        
        return this.validateObject(data, schema);
    }
    
    /**
     * Отримує повідомлення про помилку
     * @param {string} rule - Назва правила
     * @param {...*} params - Параметри для підстановки
     * @returns {string} Повідомлення
     */
    getMessage(rule, ...params) {
        let message = this.messages.get(rule) || `Validation failed for rule: ${rule}`;
        
        // Підставляємо параметри
        params.forEach((param, index) => {
            message = message.replace(`{${index}}`, param);
        });
        
        return message;
    }
    
    /**
     * Валідує ігровий стан
     * @param {Object} gameState - Стан гри
     * @returns {ValidationResult} Результат валідації
     */
    validateGameState(gameState) {
        const schema = {
            isActive: ['required'],
            board: ['required', 'minItems:1'],
            currentPlayer: ['required', 'playerNumber'],
            points: ['required', 'min:0'],
            boardSize: ['required', 'boardSize'],
            gameMode: ['gameMode']
        };
        
        return this.validateObject(gameState, schema);
    }
    
    /**
     * Валідує налаштування
     * @param {Object} settings - Налаштування
     * @returns {ValidationResult} Результат валідації
     */
    validateSettings(settings) {
        const schema = {
            language: ['required', 'language'],
            theme: ['required', 'theme'],
            style: ['required', 'style'],
            speechEnabled: ['required'],
            showBoard: ['required'],
            showMoves: ['required'],
            blockedMode: ['required']
        };
        
        return this.validateObject(settings, schema);
    }
    
    /**
     * Валідує хід
     * @param {Object} move - Хід
     * @param {Object} gameState - Поточний стан гри
     * @returns {ValidationResult} Результат валідації
     */
    validateMove(move, gameState) {
        const errors = [];
        
        // Базова валідація ходу
        if (!this.validate(move, 'validMove')) {
            errors.push('Невірний формат ходу');
        }
        
        // Перевіряємо чи хід в межах дошки
        if (move.row >= gameState.boardSize || move.col >= gameState.boardSize) {
            errors.push('Хід поза межами дошки');
        }
        
        // Перевіряємо чи клітинка вільна
        if (gameState.board[move.row][move.col] !== 0) {
            errors.push('Клітинка вже зайнята');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Очищує помилки валідації з форми
     * @param {HTMLFormElement} form - Форма
     */
    clearFormErrors(form) {
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error-field').forEach(el => {
            el.classList.remove('error-field');
        });
    }
    
    /**
     * Показує помилки валідації в формі
     * @param {HTMLFormElement} form - Форма
     * @param {Object} errors - Помилки
     */
    showFormErrors(form, errors) {
        this.clearFormErrors(form);
        
        for (const [field, fieldErrors] of Object.entries(errors)) {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('error-field');
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = fieldErrors.join(', ');
                
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
            }
        }
    }
    
    /**
     * Валідує форму в реальному часі
     * @param {HTMLFormElement} form - Форма
     * @param {Object} schema - Схема валідації
     * @param {Object} options - Опції
     */
    validateFormRealTime(form, schema, options = {}) {
        const {
            validateOnInput = true,
            validateOnBlur = true,
            showErrors = true
        } = options;
        
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (validateOnInput) {
                input.addEventListener('input', () => {
                    this.validateFormField(input, schema, showErrors);
                });
            }
            
            if (validateOnBlur) {
                input.addEventListener('blur', () => {
                    this.validateFormField(input, schema, showErrors);
                });
            }
        });
    }
    
    /**
     * Валідує поле форми
     * @param {HTMLElement} input - Поле вводу
     * @param {Object} schema - Схема валідації
     * @param {boolean} showErrors - Чи показувати помилки
     * @returns {ValidationResult} Результат валідації
     */
    validateFormField(input, schema, showErrors = true) {
        const fieldName = input.name;
        const fieldSchema = schema[fieldName];
        
        if (!fieldSchema) return { isValid: true, errors: [] };
        
        const result = this.validateValue(input.value, fieldSchema);
        
        if (showErrors) {
            // Видаляємо попередні помилки
            const existingError = input.parentNode.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            input.classList.toggle('error-field', !result.isValid);
            
            if (!result.isValid) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = result.errors.join(', ');
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
            }
        }
        
        return result;
    }
}

// Глобальний екземпляр
window.validator = new Validator();

// Експорт для модулів
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
} 