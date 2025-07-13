import { BaseComponent } from './base-component.js';
import { t } from '../localization.js';
import { stateManager } from '../state-manager.js';

export class WaitingForPlayerComponent extends BaseComponent {
    constructor(element) {
        super(element);
        this.roomId = null;
        this.onBack = this.onBack.bind(this);
        this.onCopyRoomId = this.onCopyRoomId.bind(this);
    }

    render() {
        const roomId = this.roomId || 'XXXXXX';
        
        this.element.innerHTML = `
            <div class="waiting-panel">
                <h2 class="waiting-title">${t('waiting.title')}</h2>
                <div class="room-info">
                    <p class="room-id-label">${t('waiting.roomId')}:</p>
                    <div class="room-id-container">
                        <span class="room-id">${roomId}</span>
                        <button class="copy-btn" id="copy-room-id" title="${t('waiting.copyId')}">
                            📋
                        </button>
                    </div>
                </div>
                <div class="waiting-message">
                    <p>${t('waiting.message')}</p>
                    <div class="loading-spinner"></div>
                </div>
                <div class="waiting-actions">
                    <button class="modal-button" id="back-btn">${t('waiting.back')}</button>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.element.querySelector('#back-btn')?.addEventListener('click', this.onBack);
        this.element.querySelector('#copy-room-id')?.addEventListener('click', this.onCopyRoomId);
    }

    detachEventListeners() {
        this.element.querySelector('#back-btn')?.removeEventListener('click', this.onBack);
        this.element.querySelector('#copy-room-id')?.removeEventListener('click', this.onCopyRoomId);
    }

    onBack() {
        // Закриваємо WebRTC з'єднання
        if (window.webrtcManager) {
            window.webrtcManager.destroy();
        }
        
        // Повертаємося до меню онлайн гри
        stateManager.navigateTo('onlineMenu');
    }

    onCopyRoomId() {
        if (this.roomId) {
            navigator.clipboard.writeText(this.roomId).then(() => {
                // Показуємо повідомлення про успішне копіювання
                const copyBtn = this.element.querySelector('#copy-room-id');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Помилка копіювання:', err);
            });
        }
    }

    setRoomId(roomId) {
        this.roomId = roomId;
        const roomIdElement = this.element.querySelector('.room-id');
        if (roomIdElement) {
            roomIdElement.textContent = roomId;
        }
    }

    // Метод для переходу до гри після підключення гравця
    startGame() {
        stateManager.navigateTo('gameBoard');
    }
} 