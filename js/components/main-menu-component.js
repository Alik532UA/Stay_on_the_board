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
        
        // Скидаємо флаг при кожному рендері
        this.eventsBound = false;
        
        setTimeout(() => {
            this.bindEvents();
        }, 0);
    }
    
    bindEvents() {
        // Перевіряємо, чи вже прив'язані події
        if (this.eventsBound) {
            console.log('[MainMenuComponent] bindEvents already called, skipping');
            return;
        }
        
        console.log('[MainMenuComponent] bindEvents called');
        this.eventsBound = true; // Позначаємо, що події прив'язані
        // Грати з комп'ютером
        this.element.querySelector('#btn-vs-computer')?.addEventListener('click', () => {
            console.log('[MainMenuComponent] btn-vs-computer clicked');
            stateManager.navigateTo('gameBoard', { gameMode: 'vsComputer' });
        });
        // Локальна гра
        this.element.querySelector('#btn-local-game')?.addEventListener('click', () => {
            console.log('[MainMenuComponent] btn-local-game clicked');
            stateManager.navigateTo('gameBoard', { gameMode: 'local' });
        });
        // Грати онлайн
        this.element.querySelector('#btn-online')?.addEventListener('click', () => {
            // Temporary MVP redirect
            window.location.href = 'peer-mvp.html';
        });
        // Налаштування
        this.element.querySelector('#btn-settings')?.addEventListener('click', () => {
            stateManager.navigateTo('settings');
        });
        // Керування
        this.element.querySelector('#btn-controls')?.addEventListener('click', () => {
            this.showControlsInfo();
        });
        // Правила
        this.element.querySelector('#btn-rules')?.addEventListener('click', () => {
            this.showRules();
        });
        // Очистити кеш
        this.element.querySelector('#btn-clear-cache')?.addEventListener('click', () => {
            localStorage.clear();
            location.reload();
        });

        // --- Нова логіка дропдауну тем ---
        const themeBtn = this.element.querySelector('#theme-style-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Overlay
                let overlay = document.getElementById('dropdown-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'dropdown-overlay';
                    overlay.style.position = 'fixed';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100vw';
                    overlay.style.height = '100vh';
                    overlay.style.background = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'rgba(24,16,32,0.38)' : 'rgba(255,255,255,0.32)';
                    overlay.style.backdropFilter = 'blur(8px)';
                    overlay.style.webkitBackdropFilter = 'blur(8px)';
                    overlay.style.zIndex = '9998';
                    overlay.style.transition = 'opacity 0.2s';
                    document.body.appendChild(overlay);
                } else {
                    overlay.style.display = 'block';
                    overlay.style.background = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'rgba(24,16,32,0.38)' : 'rgba(255,255,255,0.32)';
                }
                overlay.onclick = () => {
                    dropdown.style.display = 'none';
                    overlay.style.display = 'none';
                    document.removeEventListener('mousedown', closeHandler);
                    document.removeEventListener('keydown', escHandler);
                };

                let dropdown = document.getElementById('theme-style-dropdown-new');
                if (!dropdown) {
                    dropdown = document.createElement('div');
                    dropdown.id = 'theme-style-dropdown-new';
                    dropdown.style.position = 'absolute';
                    dropdown.style.minWidth = '320px';
                    dropdown.style.background = 'none';
                    dropdown.style.color = '#222';
                    dropdown.style.borderRadius = '12px';
                    dropdown.style.boxShadow = '0 8px 32px 0 rgba(80,0,80,0.18)';
                    dropdown.style.border = 'none';
                    dropdown.style.padding = '12px 16px';
                    dropdown.style.zIndex = '9999';
                    dropdown.style.display = 'flex';
                    dropdown.style.flexDirection = 'column';
                    dropdown.style.gap = '8px';
                    dropdown.innerHTML = `
                        <div class="theme-style-row" data-style="classic" style="background:rgba(255,140,0,0.4);border-radius:10px;">
                            <button class="theme-btn" data-theme="light" style="background:rgba(255,255,255,0.4);color:#222;">☀️</button>
                            <span style="flex:1;text-align:center;font-weight:600;color:#fff;">Ubuntu</span>
                            <button class="theme-btn" data-theme="dark" style="background:rgba(35,39,43,0.5);color:#fff;">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="peak" style="background:rgba(0,200,80,0.4);border-radius:10px;">
                            <button class="theme-btn" data-theme="light" style="background:rgba(255,255,255,0.4);color:#222;">☀️</button>
                            <span style="flex:1;text-align:center;font-weight:600;color:#fff;">PEAK</span>
                            <button class="theme-btn" data-theme="dark" style="background:rgba(35,39,43,0.5);color:#fff;">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="cs2" style="background:rgba(33,150,243,0.4);border-radius:10px;">
                            <button class="theme-btn" data-theme="light" style="background:rgba(255,255,255,0.4);color:#222;">☀️</button>
                            <span style="flex:1;text-align:center;font-weight:600;color:#fff;">CS&nbsp;2</span>
                            <button class="theme-btn" data-theme="dark" style="background:rgba(35,39,43,0.5);color:#fff;">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="glass" style="background:rgba(120,120,120,0.4);border-radius:10px;">
                            <button class="theme-btn" data-theme="light" style="background:rgba(255,255,255,0.4);color:#222;">☀️</button>
                            <span style="flex:1;text-align:center;font-weight:600;color:#fff;">Glassmorphism</span>
                            <button class="theme-btn" data-theme="dark" style="background:rgba(35,39,43,0.5);color:#fff;">🌙</button>
                        </div>
                        <div class="theme-style-row" data-style="material" style="background:rgba(56,142,60,0.4);border-radius:10px;">
                            <button class="theme-btn" data-theme="light" style="background:rgba(255,255,255,0.4);color:#222;">☀️</button>
                            <span style="flex:1;text-align:center;font-weight:600;color:#fff;">Material You</span>
                            <button class="theme-btn" data-theme="dark" style="background:rgba(35,39,43,0.5);color:#fff;">🌙</button>
                        </div>
                    `;
                    document.body.appendChild(dropdown);
                }
                // Позиціонування під кнопкою або по центру на мобільних
                if (window.innerWidth <= 600) {
                    dropdown.style.position = 'fixed';
                    dropdown.style.top = '50%';
                    dropdown.style.left = '50%';
                    dropdown.style.transform = 'translate(-50%, -50%)';
                    dropdown.style.width = '96vw';
                    dropdown.style.maxWidth = '360px';
                } else {
                    dropdown.style.position = 'absolute';
                    dropdown.style.transform = '';
                    dropdown.style.width = '';
                    dropdown.style.maxWidth = '320px';
                    const rect = themeBtn.getBoundingClientRect();
                    dropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
                    dropdown.style.left = `${rect.left + window.scrollX + rect.width/2 - dropdown.offsetWidth/2}px`;
                }
                dropdown.style.display = 'flex';
                // Обробник вибору теми/стилю
                dropdown.querySelectorAll('.theme-style-row .theme-btn').forEach(btn => {
                    btn.onclick = (ev) => {
                        const style = btn.closest('.theme-style-row').getAttribute('data-style');
                        const theme = btn.getAttribute('data-theme');
                        document.documentElement.setAttribute('data-style', style);
                        document.documentElement.setAttribute('data-theme', theme);
                        localStorage.setItem('style', style);
                        localStorage.setItem('theme', theme);
                        dropdown.style.display = 'none';
                        overlay.style.display = 'none';
                    };
                });
                // Закриття по кліку поза меню
                const closeHandler = (ev) => {
                    if (!dropdown.contains(ev.target) && ev.target !== themeBtn) {
                        dropdown.style.display = 'none';
                        overlay.style.display = 'none';
                        document.removeEventListener('mousedown', closeHandler);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                // Закриття по Esc
                const escHandler = (ev) => {
                    if (ev.key === 'Escape') {
                        dropdown.style.display = 'none';
                        overlay.style.display = 'none';
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
        // --- Нова логіка дропдауну мов ---
        const langBtn = this.element.querySelector('#lang-select-btn');
        if (langBtn) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Додаємо overlay
                let overlay = document.getElementById('dropdown-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'dropdown-overlay';
                    overlay.style.position = 'fixed';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100vw';
                    overlay.style.height = '100vh';
                    overlay.style.background = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'rgba(24,16,32,0.38)' : 'rgba(255,255,255,0.32)';
                    overlay.style.backdropFilter = 'blur(8px)';
                    overlay.style.webkitBackdropFilter = 'blur(8px)';
                    overlay.style.zIndex = '9998';
                    overlay.style.transition = 'opacity 0.2s';
                    document.body.appendChild(overlay);
                } else {
                    overlay.style.display = 'block';
                    overlay.style.background = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'rgba(24,16,32,0.38)' : 'rgba(255,255,255,0.32)';
                }
                overlay.onclick = () => {
                    dropdown.style.display = 'none';
                    overlay.style.display = 'none';
                    document.removeEventListener('mousedown', closeHandler);
                    document.removeEventListener('keydown', escHandler);
                };

                let dropdown = document.getElementById('lang-dropdown-new');
                if (!dropdown) {
                    dropdown = document.createElement('div');
                    dropdown.id = 'lang-dropdown-new';
                    dropdown.style.position = 'absolute';
                    dropdown.style.minWidth = '180px';
                    dropdown.style.background = 'none'; // Без білого фону
                    dropdown.style.color = '#222';
                    dropdown.style.borderRadius = '12px';
                    dropdown.style.boxShadow = '0 8px 32px 0 rgba(80,0,80,0.18)';
                    dropdown.style.border = 'none'; // Без бордера
                    dropdown.style.padding = '12px 16px';
                    dropdown.style.zIndex = '9999';
                    dropdown.style.display = 'flex';
                    dropdown.style.gap = '12px';
                    dropdown.style.justifyContent = 'center';
                    dropdown.style.alignItems = 'center';
                    dropdown.innerHTML = `
                        <button class="lang-option-new" data-lang="uk" title="Українська"><span><svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:4px;overflow:hidden;display:block;"><rect width="32" height="12" y="0" fill="#0057B7"/><rect width="32" height="12" y="12" fill="#FFD700"/></svg></span></button>
                        <button class="lang-option-new" data-lang="en" title="English">
                          <span>
                            <svg width="32" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 30">
                              <clipPath id="t">
                                <path d="M25,15h25v15zv15h-25zh-25v-15zv-15h25z"/>
                              </clipPath>
                              <path d="M0,0v30h50v-30z" fill="#012169"/>
                              <path d="M0,0 50,30M50,0 0,30" stroke="#fff" stroke-width="6"/>
                              <path d="M0,0 50,30M50,0 0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/>
                              <path d="M-1 11h22v-12h8v12h22v8h-22v12h-8v-12h-22z" fill="#C8102E" stroke="#FFF" stroke-width="2"/>
                            </svg>
                          </span>
                        </button>
                        <button class="lang-option-new" data-lang="crh" title="Qırımtatarca">
                          <span>
                            <svg width="32" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 18"><path d="m0 0h27v18H0" fill="#0cf"/><path d="m4.7 6.1h2.7m-1.4-3.6v3.6m-4-1h1.3v-2.6h5.4v2.6h1.3" fill="none" stroke="#ff0"/></svg>
                          </span>
                        </button>
                        <button class="lang-option-new" data-lang="nl" title="Nederlands"><span><svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:4px;overflow:hidden;display:block;"><rect width="32" height="8" y="0" fill="#21468B"/><rect width="32" height="8" y="8" fill="#FFF"/><rect width="32" height="8" y="16" fill="#AE1C28"/></svg></span></button>
                    `;
                    document.body.appendChild(dropdown);
                }
                // Позиціонування під кнопкою
                const rect = langBtn.getBoundingClientRect();
                dropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
                dropdown.style.left = `${rect.left + window.scrollX + rect.width/2 - dropdown.offsetWidth/2}px`;
                dropdown.style.display = 'flex';
                // Обробник вибору мови
                dropdown.querySelectorAll('.lang-option-new').forEach(btn => {
                    btn.onclick = (ev) => {
                        const lang = btn.getAttribute('data-lang');
                        localStorage.setItem('lang', lang);
                        location.reload();
                    };
                });
                // Закриття по кліку поза меню
                const closeHandler = (ev) => {
                    if (!dropdown.contains(ev.target) && ev.target !== langBtn) {
                        dropdown.style.display = 'none';
                        overlay.style.display = 'none';
                        document.removeEventListener('mousedown', closeHandler);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                // Закриття по Esc
                const escHandler = (ev) => {
                    if (ev.key === 'Escape') {
                        dropdown.style.display = 'none';
                        overlay.style.display = 'none';
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
        // --- Динамічний donate-btn ---
        const donateBtn = this.element.querySelector('#donate-btn');
        if (donateBtn) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            donateBtn.href = isMobile
                ? 'https://send.monobank.ua/jar/8TPmFKQTCK'
                : 'https://send.monobank.ua/jar/8TPmFKQTCK/';
        }
    }
    
    destroy() {
        console.log('[MainMenuComponent] destroy called');
        this.eventsBound = false; // Скидаємо флаг
        this.element.innerHTML = '';
    }
    
    subscribeToState() {
        console.log('[MainMenuComponent] subscribeToState called');
        // Підписка на зміни мови для оновлення тексту
        this.subscribe('settings.language', () => {
            console.log('[MainMenuComponent] Language changed, re-rendering');
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