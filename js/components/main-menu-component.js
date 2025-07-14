// === MAIN MENU COMPONENT ===
// Компонент головного меню з використанням нової архітектури

import { BaseComponent } from './base-component.js';
import { stateManager } from '../state-manager.js';
import { t } from '../localization.js';

export class MainMenuComponent extends BaseComponent {
    constructor(element) {
        super(element);
        this.eventsBound = false; // Флаг для відстеження чи вже прив'язані події
    }
    
    render() {
        this.element.innerHTML = `
            <div id="main-menu-container">
                <div class="main-menu-top-icons">
                    <button id="theme-style-btn" class="main-menu-icon" title="Тема">
                        <span class="main-menu-icon-inner">🎨</span>
                    </button>
                    <!-- Дропдаун тем видалено з шаблону, буде створюватися динамічно -->
                    <button id="lang-select-btn" class="main-menu-icon" title="Мова">
                        <span class="main-menu-icon-inner">
                            <!-- UA Flag Rectangle без білої обводки -->
                            <svg class="main-menu-icon-svg" width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="32" height="12" y="0" fill="#0057B7"/>
                                <rect width="32" height="12" y="12" fill="#FFD700"/>
                            </svg>
                        </span>
                    </button>
                    <a id="donate-btn" class="main-menu-icon" href="#" target="_blank" rel="noopener noreferrer" title="Підтримати проєкт">
                        <span class="main-menu-icon-inner">
                            <img src="img/coin_1fa99.png" alt="Donate" class="main-menu-icon-img" />
                        </span>
                    </a>
                </div>
                <div class="main-menu-title">
                    Залишитися на дошці
                </div>
                <div class="main-menu-subtitle">
                    Меню
                </div>
                <div id="main-menu-buttons">
                    <button class="modal-button secondary" id="btn-vs-computer">Грати з комп'ютером</button>
                    <button class="modal-button secondary" id="btn-local-game">Локальна гра</button>
                    <button class="modal-button secondary" id="btn-online">Грати онлайн</button>
                    <button class="modal-button secondary" id="btn-settings">Налаштування</button>
                    <button class="modal-button secondary" id="btn-controls">Керування</button>
                    <button class="modal-button secondary" id="btn-rules">Правила</button>
                    <button class="modal-button danger" id="btn-clear-cache">Очистити кеш</button>
                </div>
            </div>
        `;
        
        // --- ВИДАЛЕНО: this.eventsBound = false; ---
        setTimeout(() => {
            this.bindEvents();
        }, 0);
    }
    
    bindEvents() {
        // --- ДОДАНО: очищення попередніх обробників ---
        this.element.querySelectorAll('button').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        // --- ВИДАЛЕНО: if (this.eventsBound) { ... return; } ---
        // --- ВИДАЛЕНО: this.eventsBound = true; ---
        // --- ВИДАЛЕНО: старий цикл з обробниками ---
        // --- Далі залишаємо додавання нових обробників ---
        this.element.querySelector('#btn-vs-computer')?.addEventListener('click', () => {
            stateManager.navigateTo('gameBoard', { gameMode: 'vsComputer' });
        });
        this.element.querySelector('#btn-local-game')?.addEventListener('click', () => {
            stateManager.navigateTo('gameBoard', { gameMode: 'local' });
        });
        this.element.querySelector('#btn-online')?.addEventListener('click', () => {
            window.location.href = 'peer-mvp.html';
        });
        this.element.querySelector('#btn-settings')?.addEventListener('click', () => {
            stateManager.navigateTo('settings');
        });
        this.element.querySelector('#btn-controls')?.addEventListener('click', () => {
            this.showControlsInfo();
        });
        this.element.querySelector('#btn-rules')?.addEventListener('click', () => {
            this.showRules();
        });
        this.element.querySelector('#btn-clear-cache')?.addEventListener('click', () => {
            localStorage.clear();
            location.reload();
        });
        // --- ДРОПДАУН ТЕМИ ---
        const themeBtn = this.element.querySelector('#theme-style-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let overlay = document.getElementById('dropdown-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'dropdown-overlay';
                    overlay.className = 'dropdown-overlay' + (document.documentElement.getAttribute('data-theme') === 'dark' ? '' : ' light');
                    document.body.appendChild(overlay);
                } else {
                    overlay.classList.remove('hidden');
                    overlay.className = 'dropdown-overlay' + (document.documentElement.getAttribute('data-theme') === 'dark' ? '' : ' light');
                }
                overlay.onclick = () => {
                    dropdown.classList.add('hidden');
                    overlay.classList.add('hidden');
                    document.removeEventListener('mousedown', closeHandler);
                    document.removeEventListener('keydown', escHandler);
                };
                let dropdown = document.getElementById('theme-style-dropdown-new');
                if (!dropdown) {
                    dropdown = document.createElement('div');
                    dropdown.id = 'theme-style-dropdown-new';
                    dropdown.className = 'theme-dropdown';
                    dropdown.innerHTML = `
                        <div class="theme-style-row" data-style="classic">
                            <button class="theme-btn" data-theme="light">☀️</button>
                            <span class="theme-name">Ubuntu</span>
                            <button class="theme-btn" data-theme="dark">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="peak">
                            <button class="theme-btn" data-theme="light">☀️</button>
                            <span class="theme-name">PEAK</span>
                            <button class="theme-btn" data-theme="dark">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="cs2">
                            <button class="theme-btn" data-theme="light">☀️</button>
                            <span class="theme-name">CS&nbsp;2</span>
                            <button class="theme-btn" data-theme="dark">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="glass">
                            <button class="theme-btn" data-theme="light">☀️</button>
                            <span class="theme-name">Glassmorphism</span>
                            <button class="theme-btn" data-theme="dark">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="material">
                            <button class="theme-btn" data-theme="light">☀️</button>
                            <span class="theme-name">Material You</span>
                            <button class="theme-btn" data-theme="dark">🌙</button>
                        </div>
                    `;
                    document.body.appendChild(dropdown);
                }
                // Позиціонування
                if (window.innerWidth <= 600) {
                    dropdown.classList.add('mobile');
                    dropdown.classList.remove('desktop');
                } else {
                    dropdown.classList.add('desktop');
                    dropdown.classList.remove('mobile');
                    const rect = themeBtn.getBoundingClientRect();
                    dropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
                    dropdown.style.left = `${rect.left + window.scrollX + rect.width/2 - 160}px`;
                }
                dropdown.classList.remove('hidden');
                // Обробник вибору теми/стилю
                dropdown.querySelectorAll('.theme-style-row .theme-btn').forEach(btn => {
                    btn.onclick = (ev) => {
                        const style = btn.closest('.theme-style-row').getAttribute('data-style');
                        const theme = btn.getAttribute('data-theme');
                        document.documentElement.setAttribute('data-style', style);
                        document.documentElement.setAttribute('data-theme', theme);
                        localStorage.setItem('style', style);
                        localStorage.setItem('theme', theme);
                        dropdown.classList.add('hidden');
                        overlay.classList.add('hidden');
                    };
                });
                // Закриття по кліку поза меню
                const closeHandler = (ev) => {
                    if (!dropdown.contains(ev.target) && ev.target !== themeBtn) {
                        dropdown.classList.add('hidden');
                        overlay.classList.add('hidden');
                        document.removeEventListener('mousedown', closeHandler);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                // Закриття по Esc
                const escHandler = (ev) => {
                    if (ev.key === 'Escape') {
                        dropdown.classList.add('hidden');
                        overlay.classList.add('hidden');
                        document.removeEventListener('mousedown', closeHandler);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                setTimeout(() => {
                    document.addEventListener('mousedown', closeHandler);
                    document.addEventListener('keydown', escHandler);
                }, 0);
            });
        }
        // --- ДРОПДАУН МОВИ ---
        const langBtn = this.element.querySelector('#lang-select-btn');
        if (langBtn) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let overlay = document.getElementById('dropdown-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'dropdown-overlay';
                    overlay.className = 'dropdown-overlay' + (document.documentElement.getAttribute('data-theme') === 'dark' ? '' : ' light');
                    document.body.appendChild(overlay);
                } else {
                    overlay.classList.remove('hidden');
                    overlay.className = 'dropdown-overlay' + (document.documentElement.getAttribute('data-theme') === 'dark' ? '' : ' light');
                }
                overlay.onclick = () => {
                    dropdown.classList.add('hidden');
                    overlay.classList.add('hidden');
                    document.removeEventListener('mousedown', closeHandler);
                    document.removeEventListener('keydown', escHandler);
                };
                let dropdown = document.getElementById('lang-dropdown-new');
                if (!dropdown) {
                    dropdown = document.createElement('div');
                    dropdown.id = 'lang-dropdown-new';
                    dropdown.className = 'lang-dropdown';
                    dropdown.innerHTML = `
                        <button class="lang-option" data-lang="uk" title="Українська"><span>🇺🇦</span></button>
                        <button class="lang-option" data-lang="en" title="English"><span>🇬🇧</span></button>
                        <button class="lang-option" data-lang="crh" title="Qırımtatarca"><span>🏴</span></button>
                        <button class="lang-option" data-lang="nl" title="Nederlands"><span>🇳🇱</span></button>
                    `;
                    document.body.appendChild(dropdown);
                }
                // Позиціонування
                const rect = langBtn.getBoundingClientRect();
                dropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
                dropdown.style.left = `${rect.left + window.scrollX + rect.width/2 - 90}px`;
                dropdown.classList.remove('hidden');
                // Обробник вибору мови
                dropdown.querySelectorAll('.lang-option').forEach(btn => {
                    btn.onclick = (ev) => {
                        const lang = btn.getAttribute('data-lang');
                        localStorage.setItem('lang', lang);
                        location.reload();
                    };
                });
                // Закриття по кліку поза меню
                const closeHandler = (ev) => {
                    if (!dropdown.contains(ev.target) && ev.target !== langBtn) {
                        dropdown.classList.add('hidden');
                        overlay.classList.add('hidden');
                        document.removeEventListener('mousedown', closeHandler);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                // Закриття по Esc
                const escHandler = (ev) => {
                    if (ev.key === 'Escape') {
                        dropdown.classList.add('hidden');
                        overlay.classList.add('hidden');
                        document.removeEventListener('mousedown', closeHandler);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                setTimeout(() => {
                    document.addEventListener('mousedown', closeHandler);
                    document.addEventListener('keydown', escHandler);
                }, 0);
            });
        }
        // --- DONATE ---
        const donateBtn = this.element.querySelector('#donate-btn');
        if (donateBtn) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            donateBtn.href = isMobile
                ? 'https://send.monobank.ua/jar/8TPmFKQTCK'
                : 'https://send.monobank.ua/jar/8TPmFKQTCK/';
        }
    }
    
    destroy() {
        Logger.debug('[MainMenuComponent] destroy called');
        this.eventsBound = false; // Скидаємо флаг
        this.element.innerHTML = '';
    }
    
    subscribeToState() {
        Logger.debug('[MainMenuComponent] subscribeToState called');
        // Підписка на зміни мови для оновлення тексту
        this.subscribe('settings.language', () => {
            Logger.debug('[MainMenuComponent] Language changed, re-rendering');
            this.render();
        });
    }
    
    showBoardSizeSelection(onSizeSelect) {
        const sizes = [3, 4, 5, 6, 7, 8];
        const sizeButtons = sizes.map(size => 
            `<button class="modal-button secondary" data-size="${size}">${size}x${size}</button>`
        ).join('');
        
        const content = `
            <div style="text-align: center;">
                <p>${t('game.selectBoardSize')}</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 20px 0;">
                    ${sizeButtons}
                </div>
            </div>
        `;
        
        stateManager.showModal(
            t('game.boardSize'),
            content,
            [{ text: t('common.cancel'), class: 'secondary' }]
        );
        
        // Додаємо обробники для кнопок розміру
        setTimeout(() => {
            document.querySelectorAll('[data-size]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const size = parseInt(btn.dataset.size);
                    stateManager.hideModal();
                    onSizeSelect(size);
                });
            });
        }, 100);
    }
    
    showPlayerNameInput(onNamesEntered) {
        const content = `
            <div style="text-align: center;">
                <p>${t('game.enterPlayerNames')}</p>
                <div style="margin: 20px 0;">
                    <input type="text" id="player1-name" placeholder="${t('game.player1Name')}" 
                           style="width: 100%; margin-bottom: 10px; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                    <input type="text" id="player2-name" placeholder="${t('game.player2Name')}" 
                           style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                </div>
            </div>
        `;
        
        stateManager.showModal(
            t('game.playerNames'),
            content,
            [
                { text: t('common.cancel'), class: 'secondary' },
                { 
                    text: t('common.start'), 
                    class: 'primary',
                    onClick: () => {
                        const p1Name = document.getElementById('player1-name').value.trim() || t('game.player1');
                        const p2Name = document.getElementById('player2-name').value.trim() || t('game.player2');
                        stateManager.hideModal();
                        onNamesEntered(p1Name, p2Name);
                    }
                }
            ]
        );
    }
    
    showControlsInfo() {
        const content = `
            <div style="text-align: left; line-height: 1.6;">
                <h4>${t('controls.keyboard')}</h4>
                <ul>
                    <li><strong>1-9:</strong> ${t('controls.selectDirection')}</li>
                    <li><strong>Space:</strong> ${t('controls.confirmMove')}</li>
                    <li><strong>Escape:</strong> ${t('controls.cancelMove')}</li>
                    <li><strong>H:</strong> ${t('controls.showHelp')}</li>
                </ul>
                <h4>${t('controls.mouse')}</h4>
                <ul>
                    <li>${t('controls.clickDirection')}</li>
                    <li>${t('controls.clickDistance')}</li>
                    <li>${t('controls.clickConfirm')}</li>
                </ul>
            </div>
        `;
        
        stateManager.showModal(
            t('mainMenu.controls'),
            content,
            [{ text: t('common.ok'), class: 'primary' }]
        );
    }
    
    showRules() {
        const content = `
            <div style="text-align: left; line-height: 1.6;">
                <h4>Правила гри "Залишитися на дошці"</h4>
                <p><strong>Мета гри:</strong> Залишитися на дошці довше за суперника.</p>
                
                <h5>Основні правила:</h5>
                <ul>
                    <li>Гравець починає з центру дошки</li>
                    <li>За один хід можна переміститися в одному з 8 напрямків</li>
                    <li>Відстань ходу обмежена розміром дошки</li>
                    <li>Не можна виходити за межі дошки</li>
                    <li>Гравець, який не може зробити хід, програє</li>
                </ul>
                
                <h5>Керування:</h5>
                <ul>
                    <li><strong>Клавіатура:</strong> 1-9 для напрямку, Space для підтвердження</li>
                    <li><strong>Миша:</strong> Клік по кнопках напрямку та відстані</li>
                </ul>
            </div>
        `;
        
        stateManager.showModal(
            'Правила гри',
            content,
            [{ text: 'Зрозуміло', class: 'primary' }]
        );
    }
}