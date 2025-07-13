// === LOCAL GAME COMPONENT ===
import { BaseComponent } from './base-component.js';
import { stateManager } from '../state-manager.js';
import { t } from '../localization.js';

export class LocalGameComponent extends BaseComponent {
    constructor(element) {
        super(element);
    }

    render() {
        this.element.innerHTML = `
            <div class="game-board-container">
                <div class="local-game-title">Локальна гра</div>
                <div id="game-board" class="local-game-board"></div>
                <div id="game-controls" class="local-game-controls">
                    <button class="modal-button primary" id="btn-move">Зробити хід</button>
                    <button class="modal-button secondary" id="btn-back">В меню</button>
                </div>
            </div>
        `;
        this.bindEvents();
    }

    bindEvents() {
        this.element.querySelector('#btn-back')?.addEventListener('click', () => {
            stateManager.navigateTo('mainMenu');
        });
        // TODO: Додати логіку для кнопки "Зробити хід"
    }

    destroy() {
        this.element.innerHTML = '';
    }
} 