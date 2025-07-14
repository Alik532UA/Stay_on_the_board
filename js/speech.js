import { stateManager } from './state-manager.js';
import Logger from './utils/logger.js';

/**
 * Система голосового управління для гри
 * @class SpeechManager
 */
class SpeechManager {
    constructor(options = {}) {
        const {
            enabled = true,
            language = 'uk-UA',
            continuous = false,
            interimResults = false,
            maxAlternatives = 1,
            onResult = null,
            onError = null,
            onStart = null,
            onEnd = null
        } = options;
        
        this.enabled = enabled;
        this.language = language;
        this.continuous = continuous;
        this.interimResults = interimResults;
        this.maxAlternatives = maxAlternatives;
        
        this.onResult = onResult;
        this.onError = onError;
        this.onStart = onStart;
        this.onEnd = onEnd;
        
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.isDestroyed = false;
        
        this.commands = new Map();
        this.aliases = new Map();
        
        this.init();
    }
    
    /**
     * Ініціалізує систему розпізнавання мови
     */
    init() {
        if (this.isDestroyed) return;
        
        // Перевіряємо підтримку Web Speech API
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            Logger.warn('Speech recognition not supported');
            this.enabled = false;
            return;
        }
        
        // Створюємо екземпляр розпізнавання
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Налаштовуємо параметри
        this.recognition.continuous = this.continuous;
        this.recognition.interimResults = this.interimResults;
        this.recognition.maxAlternatives = this.maxAlternatives;
        this.recognition.lang = this.language;
        
        // Налаштовуємо обробники подій
        this.setupRecognitionHandlers();
        
        // Ініціалізуємо синтез мови
        this.initSynthesis();
        
        // Реєструємо стандартні команди
        this.registerDefaultCommands();
        
        Logger.info('🎤 Speech manager initialized');
    }
    
    /**
     * Налаштовує обробники подій розпізнавання
     */
    setupRecognitionHandlers() {
        this.recognition.onstart = () => {
            this.isListening = true;
            Logger.info('Speech recognition started');
            
            if (this.onStart) {
                this.onStart();
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            Logger.info('Speech recognition ended');
            
            if (this.onEnd) {
                this.onEnd();
            }
        };
        
        this.recognition.onresult = (event) => {
            const results = event.results;
            const transcript = results[results.length - 1][0].transcript.trim().toLowerCase();
            const confidence = results[results.length - 1][0].confidence;
            
            Logger.info('Speech recognized', { transcript, confidence });
            
            this.processCommand(transcript, confidence);
            
            if (this.onResult) {
                this.onResult(transcript, confidence);
            }
        };
        
        this.recognition.onerror = (event) => {
            Logger.error('Speech recognition error', { error: event.error });
            
            if (this.onError) {
                this.onError(event.error);
            }
        };
        
        this.recognition.onnomatch = () => {
            Logger.warn('No speech match found');
        };
    }
    
    /**
     * Ініціалізує синтез мови
     */
    initSynthesis() {
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        } else {
            Logger.warn('Speech synthesis not supported');
        }
    }
    
    /**
     * Реєструє стандартні команди
     */
    registerDefaultCommands() {
        // Команди навігації
        this.registerCommand('головне меню', () => {
            stateManager.navigateTo('mainMenu');
            this.speak('Перехожу до головного меню');
        });
        
        this.registerCommand('налаштування', () => {
            stateManager.navigateTo('settings');
            this.speak('Відкриваю налаштування');
        });
        
        this.registerCommand('гра', () => {
            stateManager.navigateTo('game');
            this.speak('Починаю гру');
        });
        
        // Команди гри
        this.registerCommand('новий хід', () => {
            if (stateManager.getState('game.isActive')) {
                this.speak('Готовий до нового ходу');
            }
        });
        
        this.registerCommand('показати ходи', () => {
            if (stateManager.getState('game.isActive')) {
                stateManager.setState('game.showingAvailableMoves', true);
                this.speak('Показую доступні ходи');
            }
        });
        
        this.registerCommand('сховати ходи', () => {
            if (stateManager.getState('game.isActive')) {
                stateManager.setState('game.showingAvailableMoves', false);
                this.speak('Сховую доступні ходи');
            }
        });
        
        // Команди для ходів
        this.registerCommand('вгору', () => {
            this.handleDirectionCommand('up');
        });
        
        this.registerCommand('вниз', () => {
            this.handleDirectionCommand('down');
        });
        
        this.registerCommand('ліворуч', () => {
            this.handleDirectionCommand('left');
        });
        
        this.registerCommand('праворуч', () => {
            this.handleDirectionCommand('right');
        });
        
        this.registerCommand('по діагоналі', () => {
            this.handleDirectionCommand('diagonal');
        });
        
        // Команди для відстані
        for (let i = 1; i <= 5; i++) {
            this.registerCommand(`${i} крок`, () => {
                this.handleDistanceCommand(i);
            });
            
            this.registerCommand(`${i} кроків`, () => {
                this.handleDistanceCommand(i);
            });
        }
        
        // Команди підтвердження
        this.registerCommand('підтвердити', () => {
            this.handleConfirmCommand();
        });
        
        this.registerCommand('так', () => {
            this.handleConfirmCommand();
        });
        
        this.registerCommand('ні', () => {
            this.handleCancelCommand();
        });
        
        this.registerCommand('скасувати', () => {
            this.handleCancelCommand();
        });
        
        // Команди допомоги
        this.registerCommand('допомога', () => {
            this.speak('Доступні команди: головне меню, налаштування, гра, новий хід, показати ходи, вгору, вниз, ліворуч, праворуч, по діагоналі, від одного до п\'яти кроків, підтвердити, скасувати');
        });
        
        this.registerCommand('що можна сказати', () => {
            this.speak('Доступні команди: головне меню, налаштування, гра, новий хід, показати ходи, вгору, вниз, ліворуч, праворуч, по діагоналі, від одного до п\'яти кроків, підтвердити, скасувати');
        });
        
        // Аліаси для команд
        this.registerAlias('меню', 'головне меню');
        this.registerAlias('настройки', 'налаштування');
        this.registerAlias('начать игру', 'гра');
        this.registerAlias('новый ход', 'новий хід');
        this.registerAlias('показать ходы', 'показати ходи');
        this.registerAlias('скрыть ходы', 'сховати ходи');
        this.registerAlias('вверх', 'вгору');
        this.registerAlias('вниз', 'вниз');
        this.registerAlias('влево', 'ліворуч');
        this.registerAlias('вправо', 'праворуч');
        this.registerAlias('по диагонали', 'по діагоналі');
        this.registerAlias('подтвердить', 'підтвердити');
        this.registerAlias('отменить', 'скасувати');
        this.registerAlias('помощь', 'допомога');
    }
    
    /**
     * Реєструє команду
     * @param {string} phrase - Фраза для розпізнавання
     * @param {Function} handler - Обробник команди
     */
    registerCommand(phrase, handler) {
        this.commands.set(phrase.toLowerCase(), handler);
    }
    
    /**
     * Реєструє аліас для команди
     * @param {string} alias - Аліас
     * @param {string} command - Основна команда
     */
    registerAlias(alias, command) {
        this.aliases.set(alias.toLowerCase(), command.toLowerCase());
    }
    
    /**
     * Обробляє розпізнану команду
     * @param {string} transcript - Розпізнаний текст
     * @param {number} confidence - Впевненість розпізнавання
     */
    processCommand(transcript, confidence) {
        // Перевіряємо чи є це аліас
        if (this.aliases.has(transcript)) {
            transcript = this.aliases.get(transcript);
        }
        
        // Шукаємо найкращий збіг
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [command, handler] of this.commands) {
            const score = this.calculateSimilarity(transcript, command);
            if (score > bestScore && score > 0.7) { // Мінімальний поріг схожості
                bestScore = score;
                bestMatch = { command, handler };
            }
        }
        
        if (bestMatch) {
            Logger.info('Command executed', { 
                transcript, 
                command: bestMatch.command, 
                confidence, 
                similarity: bestScore 
            });
            
            try {
                bestMatch.handler();
            } catch (error) {
                Logger.error('Command execution error', { error: error.message });
                this.speak('Помилка виконання команди');
            }
        } else {
            Logger.warn('No command match found', { transcript, confidence });
            this.speak('Команда не розпізнана');
        }
    }
    
    /**
     * Обчислює схожість між двома рядками
     * @param {string} str1 - Перший рядок
     * @param {string} str2 - Другий рядок
     * @returns {number} Коефіцієнт схожості (0-1)
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) {
            return 1.0;
        }
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    /**
     * Обчислює відстань Левенштейна
     * @param {string} str1 - Перший рядок
     * @param {string} str2 - Другий рядок
     * @returns {number} Відстань Левенштейна
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Починає прослуховування
     */
    startListening() {
        if (!this.enabled || this.isDestroyed) return;
        
        try {
            this.recognition.start();
            Logger.info('Started listening for voice commands');
        } catch (error) {
            Logger.error('Failed to start listening', { error: error.message });
        }
    }
    
    /**
     * Зупиняє прослуховування
     */
    stopListening() {
        if (!this.enabled || this.isDestroyed) return;
        
        try {
            this.recognition.stop();
            Logger.info('Stopped listening for voice commands');
        } catch (error) {
            Logger.error('Failed to stop listening', { error: error.message });
        }
    }
    
    /**
     * Проговорює текст
     * @param {string} text - Текст для проговорювання
     * @param {Object} options - Опції синтезу
     */
    speak(text, options = {}) {
        if (!this.synthesis || this.isDestroyed) return;
        
        const {
            voice = null,
            rate = 1.0,
            pitch = 1.0,
            volume = 1.0,
            lang = this.language
        } = options;
        
        // Зупиняємо попереднє проговорювання
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;
        
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            Logger.info('Started speaking', { text });
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            Logger.info('Finished speaking', { text });
        };
        
        utterance.onerror = (event) => {
            this.isSpeaking = false;
            Logger.error('Speech synthesis error', { error: event.error, text });
        };
        
        this.synthesis.speak(utterance);
    }
    
    /**
     * Зупиняє проговорювання
     */
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }
    
    /**
     * Отримує доступні голоси
     * @returns {Array} Список голосів
     */
    getVoices() {
        if (!this.synthesis) return [];
        
        return this.synthesis.getVoices().filter(voice => 
            voice.lang.startsWith('uk') || 
            voice.lang.startsWith('en') || 
            voice.lang.startsWith('nl') || 
            voice.lang.startsWith('crh')
        );
    }
    
    /**
     * Обробляє команду напрямку
     * @param {string} direction - Напрямок
     */
    handleDirectionCommand(direction) {
        if (!stateManager.getState('game.isActive')) {
            this.speak('Гра не активна');
            return;
        }
        
        stateManager.setState('game.selectedDirection', direction);
        this.speak(`Обрано напрямок: ${direction}`);
    }
    
    /**
     * Обробляє команду відстані
     * @param {number} distance - Відстань
     */
    handleDistanceCommand(distance) {
        if (!stateManager.getState('game.isActive')) {
            this.speak('Гра не активна');
            return;
        }
        
        stateManager.setState('game.selectedDistance', distance);
        this.speak(`Обрано відстань: ${distance} кроків`);
    }
    
    /**
     * Обробляє команду підтвердження
     */
    handleConfirmCommand() {
        if (!stateManager.getState('game.isActive')) {
            this.speak('Гра не активна');
            return;
        }
        
        const direction = stateManager.getState('game.selectedDirection');
        const distance = stateManager.getState('game.selectedDistance');
        
        if (!direction || !distance) {
            this.speak('Спочатку оберіть напрямок та відстань');
            return;
        }
        
        // Тут буде логіка виконання ходу
        this.speak('Хід підтверджено');
    }
    
    /**
     * Обробляє команду скасування
     */
    handleCancelCommand() {
        if (!stateManager.getState('game.isActive')) {
            this.speak('Гра не активна');
            return;
        }
        
        stateManager.setState('game.selectedDirection', null);
        stateManager.setState('game.selectedDistance', null);
        this.speak('Хід скасовано');
    }
    
    /**
     * Встановлює мову
     * @param {string} language - Код мови
     */
    setLanguage(language) {
        this.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }
    
    /**
     * Включає/виключає голосове управління
     * @param {boolean} enabled - Чи увімкнути
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled && this.isListening) {
            this.stopListening();
        }
        
        if (!enabled && this.isSpeaking) {
            this.stopSpeaking();
        }
    }
    
    /**
     * Отримує статус системи
     * @returns {Object} Статус
     */
    getStatus() {
        return {
            enabled: this.enabled,
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            language: this.language,
            commandsCount: this.commands.size,
            aliasesCount: this.aliases.size,
            voicesAvailable: this.getVoices().length
        };
    }
    
    /**
     * Отримує статистику використання
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            commandsExecuted: 0, // Тут можна додати лічильник
            recognitionErrors: 0,
            synthesisErrors: 0
        };
    }
    
    /**
     * Знищує екземпляр
     */
    destroy() {
        this.isDestroyed = true;
        
        if (this.isListening) {
            this.stopListening();
        }
        
        if (this.isSpeaking) {
            this.stopSpeaking();
        }
        
        this.commands.clear();
        this.aliases.clear();
        
        Logger.info('Speech manager destroyed');
    }
}

/**
 * Повертає вибраний голос для поточної мови
 * @returns {string} name
 */
export function getCurrentVoice() {
    const lang = stateManager.getState('settings.language');
    return localStorage.getItem(`voice_${lang}`) || '';
}

export function getVoices() { return []; }
export function getVoicesForLanguage() { return []; }

/**
 * Озвучує ігрове повідомлення
 * @param {string} message
 * @param {Object} options
 */
export function speakGameMessage(message, options = {}) {
    if (window.speechManager) {
        window.speechManager.speak(message, options);
    }
}

/**
 * Озвучує хід
 * @param {string} moveText
 * @param {Object} options
 */
export function speakMove(moveText, options = {}) {
    if (window.speechManager) {
        window.speechManager.speak(moveText, options);
    }
}

/**
 * Зберігає вибраний голос для поточної мови
 * @param {string} lang
 * @param {string} voiceName
 */
export function setVoiceForLanguage(lang, voiceName) {
    localStorage.setItem(`voice_${lang}`, voiceName);
}

/**
 * Ініціалізує голоси Web Speech API
 * @returns {Promise<void>}
 */
export function initVoices() {
    return new Promise((resolve) => {
        if (window.speechSynthesis.getVoices().length !== 0) {
            resolve();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                resolve();
            };
        }
    });
}

/**
 * Зупиняє проговорювання
 */
export function stopSpeaking() {
    if (window.speechManager) {
        window.speechManager.stopSpeaking();
    }
}

// Глобальний екземпляр
window.speechManager = new SpeechManager({
    enabled: stateManager.getState('settings.speechEnabled'),
    language: stateManager.getState('settings.language') + '-' + stateManager.getState('settings.language').toUpperCase(),
    onResult: (transcript, confidence) => {
        Logger.info('Voice command recognized', { transcript, confidence });
    },
    onError: (error) => {
        Logger.error('Voice recognition error', { error });
    }
});

// Підписка на зміни налаштувань
stateManager.subscribe('settings.speechEnabled', (enabled) => {
    if (window.speechManager) {
        window.speechManager.setEnabled(enabled);
    }
});

stateManager.subscribe('settings.language', (language) => {
    if (window.speechManager) {
        const langCode = language + '-' + language.toUpperCase();
        window.speechManager.setLanguage(langCode);
    }
});

// Експорт для модулів
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeechManager;
} 