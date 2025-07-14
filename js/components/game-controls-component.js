// === GAME CONTROLS COMPONENT ===
// Компонент для контролів гри з новою архітектурою

import { BaseComponent } from './base-component.js';
import { DOMUtils } from '../utils/dom-utils.js';
import { stateManager } from '../state-manager.js';
import { eventBus } from '../event-bus.js';
import { Logger } from '../utils/logger.js';

export class GameControlsComponent extends BaseComponent {
    constructor(element, options = {}) {
        super(element, options);
        this.selectedDirection = null;
        this.selectedDistance = null;
        this.currentPlayer = 1;
        this.centerInfoClickHandler = null;
        this.computerLastMoveDisplay = null; // <--- нове
        this.distanceManuallySelected = false; // Track if distance was manually selected
        this.subscribeToState(); // <--- Додаємо підписку на зміни стану
    }
    
    render() {
        Logger.info('[GameControlsComponent] render: початок');
        const settings = window.stateManager?.getState('settings') || {};
        const boardSize = window.stateManager?.getState('game.boardSize') || 3;
        Logger.debug('[GameControlsComponent.render] boardSize:', { boardSize });
        const showMoves = (typeof settings.showMoves === 'undefined') ? true : settings.showMoves;
        Logger.debug('[GameControlsComponent.render] settings.showMoves:', { showMoves, final: showMoves });
        
        // Синхронізуємо стан гри з налаштуваннями
        const currentShowingMoves = window.stateManager?.getState('game.showingAvailableMoves');
        if (currentShowingMoves !== showMoves) {
            Logger.debug('[GameControlsComponent.render] Syncing game.showingAvailableMoves with settings.showMoves:', { showMoves });
            window.stateManager?.setState('game.showingAvailableMoves', showMoves);
        }
        
        const showBoard = settings.showBoard !== false;
        // --- Чекбокси ---
        let checkboxesHtml = `
            <div class="game-checkboxes">
                <label class="checkbox-label">
                    <span class="ios-switch">
                        <input type="checkbox" id="show-moves-checkbox" ${showMoves ? 'checked' : ''}>
                        <span class="slider"></span>
                    </span>
                    <span>Показувати доступні ходи</span>
                </label>
                <label class="checkbox-label">
                    <span class="ios-switch">
                        <input type="checkbox" id="show-board-checkbox" ${showBoard ? 'checked' : ''}>
                        <span class="slider"></span>
                    </span>
                    <span>Показати дошку</span>
                </label>
                <label class="checkbox-label">
                    <span class="ios-switch">
                        <input type="checkbox" id="blocked-mode-checkbox" ${settings.blockedMode ? 'checked' : ''}>
                        <span class="slider"></span>
                    </span>
                    <span>Режим заблокованих клітинок</span>
                </label>
                <label class="checkbox-label">
                    <span class="ios-switch">
                        <input type="checkbox" id="speech-enabled-checkbox" ${settings.speechEnabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </span>
                    <span>Озвучування ходів <span class="settings-icon">⚙</span></span>
                </label>
            </div>
        `;
        // --- Основний блок керування ---
        this.element.innerHTML = `
            <div class="game-controls-card">
                ${showBoard ? checkboxesHtml : ''}
                <div id="visual-controls" class="visual-controls ${showBoard ? '' : 'hidden'}">
                    <div id="direction-grid" class="direction-grid">
                        <button class="control-btn" id="dir-7" data-direction="7">\u2196</button>
                        <button class="control-btn" id="dir-8" data-direction="8">\u2191</button>
                        <button class="control-btn" id="dir-9" data-direction="9">\u2197</button>
                        <button class="control-btn" id="dir-4" data-direction="4">\u2190</button>
                        <button id="center-info" class="control-btn center-info" type="button"></button>
                        <button class="control-btn" id="dir-6" data-direction="6">\u2192</button>
                        <button class="control-btn" id="dir-1" data-direction="1">\u2199</button>
                        <button class="control-btn" id="dir-2" data-direction="2">\u2193</button>
                        <button class="control-btn" id="dir-3" data-direction="3">\u2198</button>
                    </div>
                    <p class="controls-label" id="select-distance-label">Оберіть відстань:</p>
                    <div id="distance-selector" class="distance-selector"></div>
                    <button id="confirm-move-btn" class="confirm-move-btn">Підтвердити хід</button>
                    <button id="no-moves-btn" class="no-moves-btn">Мені немає куди ходити</button>
                </div>
            </div>
        `;
        this.generateDistanceButtons(boardSize);
        this.bindCheckboxEvents();
        this.syncCheckboxWithSettings();
        this.bindEvents();
        
        // Встановлюємо поточний режим гри
        const currentGameMode = window.stateManager?.getState('game.gameMode');
        if (currentGameMode) {
            Logger.debug('[GameControlsComponent] Setting initial game mode:', { currentGameMode });
            this.updateGameMode(currentGameMode);
        }
        
        Logger.info('[GameControlsComponent] render: завершено');
    }

    generateDistanceButtons(boardSize = 3) {
        const selector = this.element.querySelector('#distance-selector');
        if (!selector) {
            Logger.error('[GameControlsComponent] Distance selector not found');
            return;
        }
        
        // Валідація розміру дошки
        if (boardSize < 2 || boardSize > 9) {
            Logger.error('[GameControlsComponent] Invalid board size for distance buttons:', { boardSize });
            return;
        }
        
        selector.innerHTML = '';
        for (let i = 1; i < boardSize; i++) {
            const button = document.createElement('button');
            button.className = 'control-btn';
            button.textContent = i;
            button.dataset.distance = i;
            button.id = `dist-${i}`;
            selector.appendChild(button);
        }
        
        Logger.debug('[GameControlsComponent] Generated distance buttons:', { count: boardSize - 1, boardSize });
    }

    bindCheckboxEvents() {
        this.element.querySelector('#show-board-checkbox')?.addEventListener('change', (e) => {
            window.stateManager?.setState('settings.showBoard', e.target.checked);
            this.render();
        });
        this.element.querySelector('#show-moves-checkbox')?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            Logger.info('[GameControlsComponent] show-moves-checkbox changed to:', { isChecked });
            window.stateManager?.setState('settings.showMoves', isChecked);
            window.stateManager?.setState('game.showingAvailableMoves', isChecked);
            window.gameLogic?.toggleAvailableMoves(isChecked); // Додаємо виклик для оновлення підсвічування
            Logger.debug('[GameControlsComponent] settings.showMoves set to', { isChecked });
        });
        this.element.querySelector('#blocked-mode-checkbox')?.addEventListener('change', (e) => {
            window.stateManager?.setState('settings.blockedMode', e.target.checked);
        });
        this.element.querySelector('#speech-enabled-checkbox')?.addEventListener('change', (e) => {
            window.stateManager?.setState('settings.speechEnabled', e.target.checked);
        });
    }
    
    // Метод для примусової синхронізації чекбокса з налаштуваннями
    syncCheckboxWithSettings() {
        const settings = window.stateManager?.getState('settings') || {};
        const showMoves = (typeof settings.showMoves === 'undefined') ? true : settings.showMoves;
        const checkbox = this.element.querySelector('#show-moves-checkbox');
        if (checkbox && checkbox.checked !== showMoves) {
            Logger.debug('[GameControlsComponent] Forcing checkbox sync:', { from: checkbox.checked, to: showMoves });
            checkbox.checked = showMoves;
        }
    }
    
    bindEvents() {
        // Обробники для кнопок напрямку
        this.element.querySelectorAll('[data-direction]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = parseInt(e.target.dataset.direction);
                this.selectDirection(direction);
            });
        });
        
        // Обробники для кнопок дистанції
        this.element.querySelectorAll('[data-distance]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const distance = parseInt(e.target.dataset.distance);
                this.selectDistance(distance);
            });
        });
        
        // Обробники для основних кнопок
        Logger.debug('[GameControlsComponent] Adding event listener for confirm-move-btn');
        this.addEventListener('#confirm-move-btn', 'click', () => {
            Logger.info('[GameControlsComponent] confirm-move-btn clicked');
            this.confirmMove();
        });
        Logger.debug('[GameControlsComponent] Event listener added for confirm-move-btn');
        
        this.addEventListener('#no-moves-btn', 'click', () => {
            this.noMoves();
        });
    }
    
    subscribeToState() {
        // Підписка на зміни стану гри
        this.subscribe('game.currentPlayer', (player) => {
            this.currentPlayer = player;
            this.updatePlayerGlow();
        });
        
        this.subscribe('game.selectedDirection', (direction) => {
            this.selectedDirection = direction;
            this.updateDirectionSelection();
        });
        
        this.subscribe('game.selectedDistance', (distance) => {
            this.selectedDistance = distance;
            this.updateDistanceSelection();
        });
        
        this.subscribe('game.gameMode', (mode) => {
            Logger.debug('[GameControlsComponent] game.gameMode changed:', { mode });
            this.updateGameMode(mode);
        });
        
        this.subscribe('settings.showMoves', (show) => {
            this.updateMovesVisibility(show);
            // Оновлюємо чекбокс, щоб він відповідав налаштуванням
            const checkbox = this.element.querySelector('#show-moves-checkbox');
            if (checkbox) {
                checkbox.checked = show;
            }
            // Синхронізуємо стан гри
            window.stateManager?.setState('game.showingAvailableMoves', show);
        });
        
        // Підписка на зміни розміру дошки
        this.subscribe('game.boardSize', (newSize) => {
            console.log('[GameControlsComponent] Board size changed to:', newSize);
            this.generateDistanceButtons(newSize); // Оновлюємо лише кнопки дистанції
            this.bindEvents(); // Додаємо обробники на нові кнопки
        });
        
        // Підписка на зміни selectedDistance для діагностики
        this.subscribe('game.selectedDistance', (distance) => {
            Logger.debug('[GameControlsComponent] game.selectedDistance changed:', { 
                distance, 
                boardSize: stateManager.getState('game.boardSize'),
                maxDistance: (stateManager.getState('game.boardSize') || 3) - 1
            });
        });
    }
    
    selectDirection(direction) {
        this.computerLastMoveDisplay = null;
        
        // Отримуємо розмір дошки з валідацією
        const boardSize = stateManager.getState('game.boardSize') || 3;
        if (boardSize < 2 || boardSize > 9) {
            console.error('[GameControlsComponent] Invalid board size in selectDirection:', boardSize);
            return;
        }
        
        Logger.debug('[GameControlsComponent] selectDirection called:', { 
            direction, 
            boardSize, 
            currentSelectedDirection: this.selectedDirection, 
            currentSelectedDistance: this.selectedDistance,
            distanceManuallySelected: this.distanceManuallySelected 
        });
        
        // Якщо вибираємо той самий напрямок знову, збільшуємо відстань на 1
        if (this.selectedDirection === direction && this.selectedDistance !== null) {
            const maxDistance = boardSize - 1; // Максимальна відстань = розмір дошки - 1
            
            Logger.debug('[GameControlsComponent] Same direction selected, checking distance:', { 
                currentDistance: this.selectedDistance, 
                maxDistance 
            });
            
            if (this.selectedDistance >= maxDistance) {
                // Якщо досягли максимальної відстані, скидаємо до 1
                stateManager.setState('game.selectedDistance', 1);
                this.distanceManuallySelected = false; // Скидаємо флаг, бо відстань змінилася автоматично
                Logger.debug('[GameControlsComponent] Reset distance to 1 (max reached)');
            } else {
                // Інакше збільшуємо на 1
                const newDistance = this.selectedDistance + 1;
                stateManager.setState('game.selectedDistance', newDistance);
                this.distanceManuallySelected = false; // Скидаємо флаг, бо відстань змінилася автоматично
                Logger.debug('[GameControlsComponent] Increased distance to:', { newDistance });
            }
        } else {
            // Якщо вибираємо новий напрямок
            stateManager.setState('game.selectedDirection', direction);
            
            Logger.debug('[GameControlsComponent] New direction selected, checking manual selection:', { 
                distanceManuallySelected: this.distanceManuallySelected 
            });
            
            // Скидаємо відстань до 1 тільки якщо вона не була вибрана вручну
            if (!this.distanceManuallySelected) {
                stateManager.setState('game.selectedDistance', 1);
                Logger.debug('[GameControlsComponent] Reset distance to 1 (new direction, not manually selected)');
            } else {
                Logger.debug('[GameControlsComponent] Keeping current distance (manually selected)');
            }
        }
        
        // Логуємо фінальний стан
        setTimeout(() => {
            const finalDistance = stateManager.getState('game.selectedDistance');
            Logger.debug('[GameControlsComponent] Final state after selectDirection:', { 
                direction, 
                selectedDistance: finalDistance 
            });
        }, 10);
    }
    
    selectDistance(distance) {
        this.computerLastMoveDisplay = null;
        this.distanceManuallySelected = true; // Позначаємо, що відстань вибрана вручну
        stateManager.setState('game.selectedDistance', distance);
    }
    
    confirmMove() {
        console.log('[GameControlsComponent] confirmMove called');
        console.log('[GameControlsComponent] EventBus available:', !!eventBus);
        console.log('[GameControlsComponent] Emitting game:confirmMove event');
        eventBus.emit('game:confirmMove');
        console.log('[GameControlsComponent] Event emitted');
    }
    
    noMoves() {
        // Відправляємо сигнал про відсутність ходів в State Manager
        stateManager.setState('game.noMoves', true);
    }
    
    updatePlayerGlow() {
        const player1Glow = this.element.querySelector('#player1-glow');
        const player2Glow = this.element.querySelector('#player2-glow');
        
        if (player1Glow && player2Glow) {
            player1Glow.classList.toggle('visible', this.currentPlayer === 1);
            player2Glow.classList.toggle('visible', this.currentPlayer === 2);
        }
    }
    
    updateDirectionSelection() {
        // Видаляємо старі виділення лише для напрямків
        this.element.querySelectorAll('[data-direction].selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        // Додаємо нове виділення
        if (this.selectedDirection !== null) {
            const selectedBtn = this.element.querySelector(`[data-direction="${this.selectedDirection}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('selected');
            }
            // Оновлюємо center-info
            this.updateCenterInfo();
        } else {
            // Якщо напрямок не вибрано, повертаємо ?
            const centerInfo = this.element.querySelector('#center-info');
            if (centerInfo) centerInfo.textContent = '?';
        }
    }
    
    updateDistanceSelection() {
        // Видаляємо старі виділення лише для відстаней
        this.element.querySelectorAll('[data-distance].selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        // Додаємо нове виділення
        if (this.selectedDistance !== null) {
            const selectedBtn = this.element.querySelector(`[data-distance="${this.selectedDistance}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('selected');
            }
        }
        // Оновлюємо center-info
        this.updateCenterInfo();
    }
    
    updateCenterInfo() {
        const centerInfo = this.element.querySelector('#center-info');
        if (!centerInfo) return;
        
        // Видаляємо попередні обробники подій
        centerInfo.removeEventListener('click', this.centerInfoClickHandler);
        
        // Скидаємо всі стилі
        centerInfo.classList.remove('confirm-btn-active', 'computer-move-display', 'direction-distance-state');
        centerInfo.style.cursor = 'default';
        centerInfo.style.border = 'none';
        centerInfo.style.backgroundColor = '';
        
        // Якщо користувач нічого не вибрав, але є хід комп'ютера — показуємо його
        if (
            this.selectedDirection === null &&
            this.selectedDistance === null &&
            this.computerLastMoveDisplay
        ) {
            centerInfo.textContent = this.computerLastMoveDisplay;
            centerInfo.classList.add('computer-move-display');
            centerInfo.style.backgroundColor = 'orange';
            centerInfo.style.border = 'none';
            return;
        }

        if (this.selectedDirection !== null) {
            let arrow = '';
            switch (this.selectedDirection) {
                case 1: arrow = '↙'; break;
                case 2: arrow = '↓'; break;
                case 3: arrow = '↘'; break;
                case 4: arrow = '←'; break;
                case 6: arrow = '→'; break;
                case 7: arrow = '↖'; break;
                case 8: arrow = '↑'; break;
                case 9: arrow = '↗'; break;
                default: arrow = '?';
            }
            
            // Якщо вибрана і відстань, показуємо обидва значення і робимо кнопкою
            if (this.selectedDistance !== null) {
                centerInfo.textContent = `${arrow}${this.selectedDistance}`;
                centerInfo.classList.add('confirm-btn-active');
                centerInfo.style.cursor = 'pointer';
                
                // Додаємо обробник подій для підтвердження ходу
                this.centerInfoClickHandler = () => {
                    this.confirmMove();
                };
                centerInfo.addEventListener('click', this.centerInfoClickHandler);
            } else {
                centerInfo.textContent = arrow;
                centerInfo.classList.add('direction-distance-state');
            }
        } else if (this.selectedDistance !== null) {
            // Якщо вибрана тільки відстань, показуємо її
            centerInfo.textContent = this.selectedDistance.toString();
            centerInfo.classList.add('direction-distance-state');
        } else {
            // Початковий стан - нічого не показуємо
            centerInfo.textContent = '';
            centerInfo.style.border = 'none';
            centerInfo.style.backgroundColor = '';
        }
    }
    
    updateGameMode(mode) {
        Logger.debug('[GameControlsComponent] updateGameMode:', { mode });
        const computerDisplay = this.element.querySelector('#computer-move-display');
        if (computerDisplay) {
            if (mode === 'vsComputer') {
                computerDisplay.style.display = 'flex';
                Logger.debug('[GameControlsComponent] Computer display shown');
            } else {
                computerDisplay.style.display = 'none';
                Logger.debug('[GameControlsComponent] Computer display hidden');
            }
        } else {
            Logger.debug('[GameControlsComponent] Computer display element not found');
        }
    }
    
    updateMovesVisibility(show) {
        const controls = this.element.querySelector('#visual-controls');
        if (controls) {
            if (show) {
                controls.classList.remove('hidden');
            } else {
                controls.classList.add('hidden');
            }
        }
    }
    
    // Методи для відображення комп'ютерних ходів
    showComputerMove(direction, distance) {
        const display = this.element.querySelector('#computer-move-display');
        if (display) {
            const directionSymbols = {
                1: '↙', 2: '↓', 3: '↘',
                4: '←', 6: '→',
                7: '↖', 8: '↑', 9: '↗'
            };
            
            display.innerHTML = `
                <span class="arrow">${directionSymbols[direction] || '?'}</span>
                <span class="distance">${distance}</span>
            `;
            
            display.classList.add('computer-turn');
        }
        // Додаємо відображення ходу комп'ютера в center-info
        this.showComputerMoveInCenterInfo(direction, distance);
    }
    
    showComputerMoveInCenterInfo(direction, distance) {
        let arrow = '';
        switch (direction) {
            case 1: arrow = '↙'; break;
            case 2: arrow = '↓'; break;
            case 3: arrow = '↘'; break;
            case 4: arrow = '←'; break;
            case 6: arrow = '→'; break;
            case 7: arrow = '↖'; break;
            case 8: arrow = '↑'; break;
            case 9: arrow = '↗'; break;
            default: arrow = '?';
        }
        this.computerLastMoveDisplay = `${arrow}${distance}`;
        this.updateCenterInfo();
    }
    
    clearComputerMove() {
        const display = this.element.querySelector('#computer-move-display');
        if (display) {
            display.innerHTML = '';
            display.classList.remove('computer-turn');
        }
    }
    
    // Методи для анімацій
    animateButtonPress(buttonId) {
        const button = this.element.querySelector(`#${buttonId}`);
        if (button) {
            button.classList.add('pressed');
            setTimeout(() => {
                button.classList.remove('pressed');
            }, 150);
        }
    }
    
    // Методи для доступності
    setControlsEnabled(enabled) {
        const buttons = this.element.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = !enabled;
        });
    }
    
    // Методи для оновлення тексту
    updateLabels() {
        // Оновлюємо підписи кнопок
        const confirmBtn = this.element.querySelector('#confirm-move-btn');
        const noMovesBtn = this.element.querySelector('#no-moves-btn');
        const distanceLabel = this.element.querySelector('#select-distance-label');
        
        if (confirmBtn) confirmBtn.textContent = 'Підтвердити хід';
        if (noMovesBtn) noMovesBtn.textContent = 'Немає ходів';
        if (distanceLabel) distanceLabel.textContent = 'Виберіть дистанцію:';
    }
    
    // Очищення ресурсів
    destroy() {
        console.log('[GameControlsComponent] destroy');
        // Видаляємо обробники подій
        if (this.centerInfoClickHandler) {
            const centerInfo = this.element.querySelector('#center-info');
            if (centerInfo) {
                centerInfo.removeEventListener('click', this.centerInfoClickHandler);
            }
        }
        // Викликаємо батьківський метод для очищення підписок та інших ресурсів
        super.destroy();
    }
} 