/**
 * ФІНАЛЬНА ВЕРСІЯ ГОЛОВНОГО ФАЙЛУ ДОДАТКУ
 * Інтеграція всіх систем: EventBus, Logger, DOMCache, Analytics, Validator, Network, Speech
 */

// === ІМПОРТИ СИСТЕМ ===
import { ViewManager } from './view-manager.js';
import { MainMenuComponent } from './components/main-menu-component.js';
import { ModalComponent } from './components/modal-component.js';
import { stateManager } from './state-manager.js';
import { gameLogic } from './game-logic-new.js';
import { t, loadLanguage } from './localization.js';
import { initTheme, updateThemeButtons, updateThemeStyleDropdownActive, applyBodyBackground } from './ui.js';
import uk from '../lang/uk.js';
import en from '../lang/en.js';
import nl from '../lang/nl.js';
import crh from '../lang/crh.js';
import { eventBus } from './event-bus.js';
import { GameBoardComponent } from './components/game-board-component.js';
import { LocalGameComponent } from './components/local-game-component.js';
import { OnlineMenuComponent } from './components/online-menu-component.js';
import { GameControlsComponent } from './components/game-controls-component.js';

window.translationsAll = {
  uk,
  en,
  nl,
  crh
};

window.gameLogic = gameLogic;

// === КЛАС ГОЛОВНОГО ДОДАТКУ ===
class App {
    constructor() {
        window.app = this;
        this.viewManager = new ViewManager();
        this.isInitialized = false;
        this.startTime = Date.now();

        // === МОДАЛЬНЕ ВІКНО ===
        // Додаємо контейнер для модального вікна, якщо його немає
        let modalContainer = document.getElementById('modal-root');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-root';
            document.body.appendChild(modalContainer);
        }
        this.modalComponent = new ModalComponent(modalContainer);

        // Підписка на зміни view
        stateManager.subscribe('ui.currentView', (view) => {
            Logger.debug('[App] ui.currentView changed:', { view });
            switch (view) {
                case 'mainMenu':
                    this.viewManager.render('mainMenu', MainMenuComponent);
                    break;
                case 'gameBoard':
                    this.viewManager.render('gameBoard', GameBoardComponent);
                    break;
                case 'onlineMenu':
                    this.viewManager.render('onlineMenu', OnlineMenuComponent);
                    break;
                default:
                    this.viewManager.render('mainMenu', MainMenuComponent);
            }
        });
        // Рендеримо початковий view
        const initialView = stateManager.getState('ui.currentView');
        Logger.debug('[App] Initial view:', { initialView });
        if (initialView) {
            switch (initialView) {
                case 'mainMenu':
                    this.viewManager.render('mainMenu', MainMenuComponent);
                    break;
                case 'gameBoard':
                    this.viewManager.render('gameBoard', GameBoardComponent);
                    break;
                case 'onlineMenu':
                    this.viewManager.render('onlineMenu', OnlineMenuComponent);
                    break;
                default:
                    this.viewManager.render('mainMenu', MainMenuComponent);
            }
        }

        // Ініціалізація систем
        this.initSystems();
        this.init();
    }

    /**
     * Ініціалізує всі системи
     */
    initSystems() {
        // Логуємо початок ініціалізації
        Logger.start('App initialization', { timestamp: this.startTime });

        // Ініціалізуємо EventBus middleware
        this.setupEventBusMiddleware();

        // Ініціалізуємо Network middleware
        this.setupNetworkMiddleware();

        // Ініціалізуємо Analytics
        this.setupAnalytics();

        // Ініціалізуємо валідацію
        this.setupValidation();

        // Ініціалізуємо голосове управління
        this.setupSpeechControl();

        Logger.info('Systems initialized successfully');
    }

    /**
     * Налаштовує EventBus middleware
     */
    setupEventBusMiddleware() {
        // Middleware для логування подій
        eventBus.use((eventData) => {
            Logger.debug('Event emitted', {
                event: eventData.event,
                data: eventData.data,
                timestamp: eventData.timestamp
            });
            return eventData;
        });

        // Middleware для аналітики
        eventBus.use((eventData) => {
            if (window.analytics) {
                window.analytics.track('app_event', {
                    event: eventData.event,
                    data: eventData.data
                });
            }
            return eventData;
        });

        Logger.info('EventBus middleware configured');
    }

    /**
     * Налаштовує Network middleware
     */
    setupNetworkMiddleware() {
        if (window.networkManager) {
            // Middleware для логування запитів
            window.networkManager.useRequest((config) => {
                Logger.debug('Network request', {
                    url: config.url,
                    method: config.method,
                    headers: config.headers
                });
            });

            // Middleware для аналітики
            window.networkManager.useRequest((config) => {
                if (window.analytics) {
                    window.analytics.track('network_request', {
                        url: config.url,
                        method: config.method
                    });
                }
            });

            // Middleware для обробки помилок
            window.networkManager.useError((error) => {
                Logger.error('Network error', { error: error.message });

                if (window.analytics) {
                    window.analytics.trackError(error, { context: 'network' });
                }
            });

            Logger.info('Network middleware configured');
        }
    }

    /**
     * Налаштовує аналітику
     */
    setupAnalytics() {
        if (window.analytics) {
            // Відстежуємо початкові метрики
            window.analytics.track('app_started', {
                version: '1.0.0',
                timestamp: this.startTime
            });

            // Відстежуємо зміни налаштувань
            stateManager.subscribe('settings', (settings) => {
                window.analytics.trackSetting('settings_updated', settings);
            });

            // Відстежуємо ігрові події
            stateManager.subscribe('game', (gameState) => {
                if (gameState.isActive) {
                    window.analytics.trackGameEvent('game_state_changed', gameState);
                }
            });

            Logger.info('Analytics configured');
        }
    }

    /**
     * Налаштовує валідацію
     */
    setupValidation() {
        if (window.validator) {
            // Валідуємо зміни стану
            stateManager.subscribe('game', (gameState) => {
                const result = window.validator.validateGameState(gameState);
                if (!result.isValid) {
                    Logger.warn('Invalid game state', { errors: result.errors });
                }
            });

            stateManager.subscribe('settings', (settings) => {
                const result = window.validator.validateSettings(settings);
                if (!result.isValid) {
                    Logger.warn('Invalid settings', { errors: result.errors });
                }
            });

            Logger.info('Validation configured');
        }
    }

    /**
     * Налаштовує голосове управління
     */
    setupSpeechControl() {
        if (window.speechManager) {
            // Додаємо кастомні команди
            window.speechManager.registerCommand('статистика', () => {
                this.showStats();
            });

            window.speechManager.registerCommand('очистити кеш', () => {
                if (window.domCache) {
                    window.domCache.clear();
                    window.speechManager.speak('Кеш очищено');
                }
            });

            window.speechManager.registerCommand('показати логи', () => {
                this.showLogs();
            });

            Logger.info('Speech control configured');
        }
    }

    /**
     * Ініціалізує додаток
     */
    init() {
        if (this.isInitialized) return;

        Logger.info('🚀 Ініціалізація додатку Stay on the board');

        try {
            // Ініціалізація теми
            this.initTheme();

            // Ініціалізація мови
            this.initLanguage();

            // Налаштування глобальних контролів
            this.setupGlobalControls();

            // Підписка на зміни мови
            this.setupLanguageSubscription();

            // Підписка на зміни теми
            this.setupThemeSubscription();

            // Підписка на зміни стану гри
            this.setupGameSubscription();

            // Налаштування обробників помилок
            this.setupErrorHandling();

            // Налаштування продуктивності
            this.setupPerformanceMonitoring();

            // Запуск додатку
            this.start();

            this.isInitialized = true;
            Logger.info('✅ Додаток успішно ініціалізовано');

            // Відстежуємо успішну ініціалізацію
            if (window.analytics) {
                window.analytics.track('app_initialized', {
                    duration: Date.now() - this.startTime
                });
            }

        } catch (error) {
            Logger.error('❌ Помилка ініціалізації додатку', { error: error.message, stack: error.stack });
            this.handleError(error);
        }
    }

    /**
     * Ініціалізує тему
     */
    initTheme() {
        try {
            initTheme();
            updateThemeButtons();
            updateThemeStyleDropdownActive();
            applyBodyBackground();
            Logger.info('✅ Тема ініціалізована');
        } catch (error) {
            Logger.warn('⚠️ Помилка ініціалізації теми', { error: error.message });
        }
    }

    /**
     * Ініціалізує мову
     */
    initLanguage() {
        try {
            const currentLang = localStorage.getItem('lang') || 'uk';
            loadLanguage(currentLang);
            Logger.info('✅ Мова ініціалізована', { language: currentLang });
        } catch (error) {
            Logger.warn('⚠️ Помилка ініціалізації мови', { error: error.message });
        }
    }

    /**
     * Налаштовує глобальні контроли
     */
    setupGlobalControls() {
        try {
            const themeStyleBtn = document.getElementById('theme-style-btn');
            const themeStyleDropdown = document.getElementById('theme-style-dropdown');
            const langBtn = document.getElementById('lang-btn');
            const langDropdown = document.getElementById('lang-dropdown');

            // Обробники для теми
            if (themeStyleBtn) {
                themeStyleBtn.addEventListener('click', (e) => {
                    if (themeStyleDropdown) themeStyleDropdown.classList.toggle('hidden');
                    if (langDropdown) langDropdown.classList.add('hidden');
                    e.stopPropagation();

                    // Відстежуємо клік
                    if (window.analytics) {
                        window.analytics.trackClick('theme-style-button');
                    }
                });
            }

            // Обробники для мови
            if (langBtn) {
                langBtn.addEventListener('click', (e) => {
                    if (langDropdown) langDropdown.classList.toggle('hidden');
                    if (themeStyleDropdown) themeStyleDropdown.classList.add('hidden');
                    e.stopPropagation();

                    // Відстежуємо клік
                    if (window.analytics) {
                        window.analytics.trackClick('language-button');
                    }
                });
            }

            // Закриття дропдаунів при кліку поза ними
            document.addEventListener('click', (e) => {
                if (themeStyleDropdown && !themeStyleDropdown.contains(e.target) && e.target !== themeStyleBtn) {
                    themeStyleDropdown.classList.add('hidden');
                }
                if (langDropdown && !langDropdown.contains(e.target) && e.target !== langBtn) {
                    langDropdown.classList.add('hidden');
                }
            });

            // Обробники для вибору мови
            document.querySelectorAll('.lang-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const lang = opt.getAttribute('data-lang');
                    stateManager.setState('settings.language', lang);
                    if (langDropdown) langDropdown.classList.add('hidden');

                    // Відстежуємо зміну мови
                    if (window.analytics) {
                        window.analytics.trackSetting('language', lang);
                    }
                });
            });

            // Обробники для вибору теми
            document.querySelectorAll('.theme-style-row').forEach(row => {
                const style = row.getAttribute('data-style');
                row.querySelectorAll('.theme-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const theme = btn.getAttribute('data-theme');
                        stateManager.updateSettings({ style, theme });
                        if (themeStyleDropdown) themeStyleDropdown.classList.add('hidden');

                        // Відстежуємо зміну теми
                        if (window.analytics) {
                            window.analytics.trackSetting('theme', theme);
                            window.analytics.trackSetting('style', style);
                        }
                    });
                });
            });

            Logger.info('✅ Глобальні контроли налаштовані');
        } catch (error) {
            Logger.warn('⚠️ Помилка налаштування глобальних контролів', { error: error.message });
        }
    }

    /**
     * Налаштовує підписку на зміни мови
     */
    setupLanguageSubscription() {
        stateManager.subscribe('settings.language', (newLang) => {
            try {
                loadLanguage(newLang);
                this.updateLanguageDependentUI();
                Logger.info('🌍 Мову змінено', { language: newLang });

                // Оновлюємо мову для голосового управління
                if (window.speechManager) {
                    const langCode = newLang + '-' + newLang.toUpperCase();
                    window.speechManager.setLanguage(langCode);
                }
            } catch (error) {
                Logger.error('❌ Помилка зміни мови', { error: error.message });
            }
        });
    }

    /**
     * Налаштовує підписку на зміни теми
     */
    setupThemeSubscription() {
        stateManager.subscribe('settings.theme', (newTheme) => {
            try {
                document.documentElement.setAttribute('data-theme', newTheme);
                updateThemeButtons();
                applyBodyBackground();
                Logger.info('🎨 Тему змінено', { theme: newTheme });
            } catch (error) {
                Logger.error('❌ Помилка зміни теми', { error: error.message });
            }
        });

        stateManager.subscribe('settings.style', (newStyle) => {
            try {
                document.documentElement.setAttribute('data-style', newStyle);
                updateThemeStyleDropdownActive();
                applyBodyBackground();
                Logger.info('🎨 Стиль змінено', { style: newStyle });
            } catch (error) {
                Logger.error('❌ Помилка зміни стилю', { error: error.message });
            }
        });
    }

    /**
     * Налаштовує підписку на зміни стану гри
     */
    setupGameSubscription() {
        // Підписка на зміни стану гри
        stateManager.subscribe('game.isActive', (isActive) => {
            Logger.info('🎮 Стан гри змінено', { isActive });

            if (window.analytics) {
                window.analytics.trackGameEvent('game_state_changed', { isActive });
            }
        });

        stateManager.subscribe('game.currentPlayer', (player) => {
            Logger.info('👤 Поточний гравець', { player });
        });

        stateManager.subscribe('game.points', (points) => {
            Logger.info('📊 Очки оновлено', { points });
        });

        // Підписка на помилки гри
        stateManager.subscribe('ui.error', (error) => {
            if (error) {
                Logger.error('❌ Помилка UI', { error });

                if (window.analytics) {
                    window.analytics.trackError(error, { context: 'ui' });
                }
            }
        });
    }

    /**
     * Налаштовує обробку помилок
     */
    setupErrorHandling() {
        // Глобальний обробник помилок
        window.addEventListener('error', (event) => {
            Logger.error('❌ Глобальна помилка', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });

            if (window.analytics) {
                window.analytics.trackError(event.error, { context: 'global' });
            }
        });

        // Обробник необроблених Promise помилок
        window.addEventListener('unhandledrejection', (event) => {
            Logger.error('❌ Необроблена Promise помилка', {
                reason: event.reason
            });

            if (window.analytics) {
                window.analytics.trackError(event.reason, { context: 'promise' });
            }
        });

        Logger.info('✅ Обробка помилок налаштована');
    }

    /**
     * Налаштовує моніторинг продуктивності
     */
    setupPerformanceMonitoring() {
        // Відстежуємо завантаження сторінки
        window.addEventListener('load', () => {
            const loadTime = Date.now() - this.startTime;
            Logger.info('📊 Сторінка завантажена', { loadTime });

            if (window.analytics) {
                window.analytics.trackPerformance('page_load', loadTime);
            }
        });

        // Відстежуємо продуктивність кешу
        if (window.domCache) {
            setInterval(() => {
                const stats = window.domCache.getStats();
                if (stats.hitRate < 50) {
                    Logger.warn('⚠️ Низька ефективність кешу', { hitRate: stats.hitRate });
                }
            }, 60000); // Кожну хвилину
        }

        Logger.info('✅ Моніторинг продуктивності налаштований');
    }

    /**
     * Оновлює UI залежний від мови
     */
    updateLanguageDependentUI() {
        try {
            // Оновлюємо заголовки
            const titleElements = document.querySelectorAll('[data-i18n]');
            titleElements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (key) {
                    element.textContent = t(key);
                }
            });

            // Оновлюємо плейсхолдери
            const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
            placeholderElements.forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                if (key) {
                    element.placeholder = t(key);
                }
            });

            Logger.debug('UI оновлено для нової мови');
        } catch (error) {
            Logger.warn('Помилка оновлення UI', { error: error.message });
        }
    }

    /**
     * Обробляє помилки
     */
    handleError(error) {
        Logger.error('Критична помилка додатку', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Показуємо користувачу повідомлення про помилку
        if (window.viewManager) {
            window.viewManager.showError('Помилка ініціалізації додатку', error.message);
        }

        // Відстежуємо помилку в аналітиці
        if (window.analytics) {
            window.analytics.trackError(error, { context: 'initialization' });
        }
    }

    /**
     * Запускає додаток
     */
    start() {
        try {
            // Переходимо до головного меню
            stateManager.navigateTo('mainMenu');

            // Запускаємо голосове управління якщо увімкнено
            if (stateManager.getState('settings.speechEnabled') && window.speechManager) {
                window.speechManager.startListening();
            }

            Logger.info('🎮 Додаток запущено');

            // Відстежуємо запуск
            if (window.analytics) {
                window.analytics.track('app_started');
            }

        } catch (error) {
            Logger.error('Помилка запуску додатку', { error: error.message });
            throw error;
        }
    }

    /**
     * Показує статистику додатку
     */
    showStats() {
        const stats = {
            app: {
                uptime: Date.now() - this.startTime,
                isInitialized: this.isInitialized
            },
            state: stateManager.getStats(),
            cache: window.domCache ? window.domCache.getStats() : null,
            network: window.networkManager ? window.networkManager.getStats() : null,
            speech: window.speechManager ? window.speechManager.getStatus() : null,
            analytics: window.analytics ? window.analytics.getStats() : null,
            logs: Logger.getStats()
        };

        console.log('📊 Статистика додатку:', stats);

        if (window.speechManager) {
            window.speechManager.speak('Статистика виведена в консоль');
        }
    }

    /**
     * Показує логи
     */
    showLogs() {
        const logs = Logger.getStoredLogs();
        console.log('📋 Логи додатку:', logs);

        if (window.speechManager) {
            window.speechManager.speak(`Знайдено ${logs.length} логів`);
        }
    }

    /**
     * Отримує статистику додатку
     */
    getStats() {
        return {
            uptime: Date.now() - this.startTime,
            isInitialized: this.isInitialized,
            systems: {
                eventBus: !!window.eventBus,
                logger: !!window.Logger,
                domCache: !!window.domCache,
                analytics: !!window.analytics,
                validator: !!window.validator,
                network: !!window.networkManager,
                speech: !!window.speechManager
            }
        };
    }

    /**
     * Знищує додаток
     */
    destroy() {
        try {
            Logger.info('🔄 Знищення додатку');

            // Зупиняємо голосове управління
            if (window.speechManager) {
                window.speechManager.destroy();
            }

            // Зупиняємо мережеві запити
            if (window.networkManager) {
                window.networkManager.destroy();
            }

            // Очищуємо кеш
            if (window.domCache) {
                window.domCache.destroy();
            }

            // Зупиняємо аналітику
            if (window.analytics) {
                window.analytics.destroy();
            }

            // Очищуємо EventBus
            if (window.eventBus) {
                window.eventBus.destroy();
            }

            this.isInitialized = false;

            Logger.info('✅ Додаток знищено');

        } catch (error) {
            Logger.error('Помилка знищення додатку', { error: error.message });
        }
    }
}

// === Заглушки для сторінок ===

// === ІНІЦІАЛІЗАЦІЯ ДОДАТКУ ===
let app;

document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new App();
        // Робимо додаток доступним глобально для дебагу
        window.app = app;

        Logger.info('🎉 Додаток Stay on the board готовий до роботи');

    } catch (error) {
        console.error('Критична помилка при ініціалізації додатку:', error);

        // Показуємо повідомлення про помилку
        document.body.innerHTML = `
            <div class="error-container">
                <h1>Помилка завантаження</h1>
                <p>Не вдалося завантажити додаток. Спробуйте оновити сторінку.</p>
                <p>Деталі: ${error.message}</p>
            </div>
        `;
    }
});

// Обробка закриття сторінки
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});

// Експорт для модулів
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} 