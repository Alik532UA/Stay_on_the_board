// === SETTINGS COMPONENT ===
// Компонент налаштувань з використанням нової архітектури

import { BaseComponent } from './base-component.js';
import { stateManager } from '../state-manager.js';
import { t } from '../localization.js';

export class SettingsComponent extends BaseComponent {
    constructor(element, options = {}) {
        super(element, options);
    }
    
    render() {
        const settings = stateManager.getState('settings');
        
        this.element.innerHTML = `
            <div id="settings-container">
                <div class="settings-title">
                    ${t('settings.title')}
                </div>
                
                <div class="settings-section">
                    <h3>${t('settings.appearance')}</h3>
                    
                    <div class="setting-item">
                        <label for="theme-select">${t('settings.theme')}</label>
                        <select id="theme-select" class="settings-select">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>${t('settings.lightTheme')}</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>${t('settings.darkTheme')}</option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label for="style-select">${t('settings.style')}</label>
                        <select id="style-select" class="settings-select">
                            <option value="classic" ${settings.style === 'classic' ? 'selected' : ''}>Ubuntu</option>
                            <option value="peak" ${settings.style === 'peak' ? 'selected' : ''}>PEAK</option>
                            <option value="cs2" ${settings.style === 'cs2' ? 'selected' : ''}>CS 2</option>
                            <option value="glass" ${settings.style === 'glass' ? 'selected' : ''}>Glassmorphism</option>
                            <option value="material" ${settings.style === 'material' ? 'selected' : ''}>Material You</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>${t('settings.gameplay')}</h3>
                    
                    <div class="setting-item">
                        <label for="show-board-checkbox" class="checkbox-label">
                            <span class="ios-switch">
                                <input type="checkbox" id="show-board-checkbox" ${settings.showBoard ? 'checked' : ''}>
                                <span class="slider"></span>
                            </span>
                            ${t('settings.showBoard')}
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="show-moves-checkbox" class="checkbox-label">
                            <span class="ios-switch">
                                <input type="checkbox" id="show-moves-checkbox" ${settings.showMoves ? 'checked' : ''}>
                                <span class="slider"></span>
                            </span>
                            ${t('settings.showMoves')}
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="blocked-mode-checkbox" class="checkbox-label">
                            <span class="ios-switch">
                                <input type="checkbox" id="blocked-mode-checkbox" ${settings.blockedMode ? 'checked' : ''}>
                                <span class="slider"></span>
                            </span>
                            ${t('settings.blockedMode')}
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>${t('settings.accessibility')}</h3>
                    
                    <div class="setting-item">
                        <label for="speech-enabled-checkbox" class="checkbox-label">
                            <span class="ios-switch">
                                <input type="checkbox" id="speech-enabled-checkbox" ${settings.speechEnabled ? 'checked' : ''}>
                                <span class="slider"></span>
                            </span>
                            ${t('settings.speechEnabled')}
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="language-select">${t('settings.language')}</label>
                        <select id="language-select" class="settings-select">
                            <option value="uk" ${settings.language === 'uk' ? 'selected' : ''}>Українська</option>
                            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="crh" ${settings.language === 'crh' ? 'selected' : ''}>Qırımtatarca</option>
                            <option value="nl" ${settings.language === 'nl' ? 'selected' : ''}>Nederlands</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="modal-button secondary" id="btn-back">
                        ${t('common.back')}
                    </button>
                    <button class="modal-button primary" id="btn-save">
                        ${t('common.save')}
                    </button>
                </div>
            </div>
        `;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Кнопка "Назад"
        this.addEventListener('#btn-back', 'click', () => {
            stateManager.navigateTo('mainMenu');
        });
        
        // Кнопка "Зберегти"
        this.addEventListener('#btn-save', 'click', () => {
            this.saveSettings();
        });
        
        // Обробники для чекбоксів
        this.addEventListener('#show-board-checkbox', 'change', (e) => {
            stateManager.setState('settings.showBoard', e.target.checked);
        });
        
        this.addEventListener('#show-moves-checkbox', 'change', (e) => {
            stateManager.setState('settings.showMoves', e.target.checked);
        });
        
        this.addEventListener('#blocked-mode-checkbox', 'change', (e) => {
            const blockedMode = e.target.checked;
            stateManager.setState('settings.blockedMode', blockedMode);
            console.log('[DIAG] settings.blockedMode після кліку:', blockedMode);
            
            // Додатково викликаємо toggleBlockedMode для ініціалізації заблокованих клітинок
            if (window.gameLogic && typeof window.gameLogic.toggleBlockedMode === 'function') {
                window.gameLogic.toggleBlockedMode(blockedMode);
                console.log('[DIAG] toggleBlockedMode викликано з:', blockedMode);
            } else {
                console.log('[DIAG] gameLogic.toggleBlockedMode недоступний');
            }
        });
        
        this.addEventListener('#speech-enabled-checkbox', 'change', (e) => {
            stateManager.setState('settings.speechEnabled', e.target.checked);
        });
        
        // Обробники для селектів
        this.addEventListener('#theme-select', 'change', (e) => {
            stateManager.setState('settings.theme', e.target.value);
        });
        
        this.addEventListener('#style-select', 'change', (e) => {
            stateManager.setState('settings.style', e.target.value);
        });
        
        this.addEventListener('#language-select', 'change', (e) => {
            stateManager.setState('settings.language', e.target.value);
        });
    }
    
    subscribeToState() {
        // Підписка на зміни мови для оновлення тексту
        this.subscribe('settings.language', () => {
            this.render();
            this.bindEvents();
        });
        
        // Підписка на зміни налаштувань для оновлення UI
        this.subscribe('settings', (settings) => {
            this.updateSettingsUI(settings);
        });
    }
    
    updateSettingsUI(settings) {
        // Оновлюємо чекбокси
        const showBoardCheckbox = this.element.querySelector('#show-board-checkbox');
        if (showBoardCheckbox) {
            showBoardCheckbox.checked = settings.showBoard;
        }
        
        const showMovesCheckbox = this.element.querySelector('#show-moves-checkbox');
        if (showMovesCheckbox) {
            showMovesCheckbox.checked = settings.showMoves;
        }
        
        const blockedModeCheckbox = this.element.querySelector('#blocked-mode-checkbox');
        if (blockedModeCheckbox) {
            blockedModeCheckbox.checked = settings.blockedMode;
        }
        
        const speechEnabledCheckbox = this.element.querySelector('#speech-enabled-checkbox');
        if (speechEnabledCheckbox) {
            speechEnabledCheckbox.checked = settings.speechEnabled;
        }
        
        // Оновлюємо селекти
        const themeSelect = this.element.querySelector('#theme-select');
        if (themeSelect) {
            themeSelect.value = settings.theme;
        }
        
        const styleSelect = this.element.querySelector('#style-select');
        if (styleSelect) {
            styleSelect.value = settings.style;
        }
        
        const languageSelect = this.element.querySelector('#language-select');
        if (languageSelect) {
            languageSelect.value = settings.language;
        }
    }
    
    saveSettings() {
        // Налаштування автоматично зберігаються в State Manager
        // Показуємо повідомлення про успішне збереження
        stateManager.showModal(
            t('settings.saved'),
            t('settings.savedMessage'),
            [{ text: t('common.ok'), class: 'primary' }]
        );
    }
} 