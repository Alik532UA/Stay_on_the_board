import { BaseComponent } from './base-component.js';
import { t } from '../localization.js';
import { stateManager } from '../state-manager.js';

export class JoinRoomComponent extends BaseComponent {
    constructor(element) {
        super(element);
        this.onJoin = this.onJoin.bind(this);
        this.onBack = this.onBack.bind(this);
        this.onPaste = this.onPaste.bind(this);
    }

    render() {
        this.element.innerHTML = `
            <div class="join-room-panel">
                <h2 class="join-room-title">${t('joinRoom.title')}</h2>
                <div class="join-form">
                    <div class="form-group">
                        <label for="player-name">${t('joinRoom.playerName')}:</label>
                        <input type="text" id="player-name" placeholder="${t('joinRoom.playerNamePlaceholder')}" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label for="room-code">${t('joinRoom.roomCode')}:</label>
                        <div class="room-code-container">
                            <input type="text" id="room-code" class="room-code-input" placeholder="XXXXXX" maxlength="6">
                            <button class="paste-btn" id="paste-btn" title="${t('joinRoom.paste')}">
                                📋
                            </button>
                        </div>
                    </div>
                </div>
                <div class="join-actions">
                    <button class="modal-button primary" id="join-btn">${t('joinRoom.join')}</button>
                    <button class="modal-button" id="back-btn">${t('joinRoom.back')}</button>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.element.querySelector('#join-btn')?.addEventListener('click', this.onJoin);
        this.element.querySelector('#back-btn')?.addEventListener('click', this.onBack);
        this.element.querySelector('#paste-btn')?.addEventListener('click', this.onPaste);
        
        // Автоматично великі літери для коду кімнати
        this.element.querySelector('#room-code')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    detachEventListeners() {
        this.element.querySelector('#join-btn')?.removeEventListener('click', this.onJoin);
        this.element.querySelector('#back-btn')?.removeEventListener('click', this.onBack);
        this.element.querySelector('#paste-btn')?.removeEventListener('click', this.onPaste);
    }

    onJoin() {
        const playerName = this.element.querySelector('#player-name').value.trim();
        const roomCode = this.element.querySelector('#room-code').value.trim();
        
        if (!roomCode) {
            alert(t('joinRoom.errorNoCode'));
            return;
        }
        
        if (roomCode.length !== 6) {
            alert(t('joinRoom.errorInvalidCode'));
            return;
        }
        
        this.joinRoom(roomCode, playerName || 'Гравець');
    }

    async joinRoom(roomCode, playerName) {
        try {
            // Показуємо індикатор завантаження
            const joinBtn = this.element.querySelector('#join-btn');
            const originalText = joinBtn.textContent;
            joinBtn.textContent = t('joinRoom.connecting');
            joinBtn.disabled = true;
            
            // Ініціалізуємо WebRTC
            if (!window.webrtcManager) {
                throw new Error('WebRTC Manager не доступний');
            }
            
            await window.webrtcManager.initialize(playerName);
            await window.webrtcManager.joinRoom(roomCode);
            
            // Налаштовуємо обробники подій
            window.webrtcManager.onConnectionEstablished = () => {
                console.log('[JoinRoomComponent] З\'єднання встановлено');
                stateManager.navigateTo('gameBoard');
            };
            
            window.webrtcManager.onError = (error) => {
                console.error('[JoinRoomComponent] Помилка з\'єднання:', error);
                alert(t('joinRoom.errorConnection'));
                
                // Відновлюємо кнопку
                joinBtn.textContent = originalText;
                joinBtn.disabled = false;
            };
            
        } catch (error) {
            console.error('[JoinRoomComponent] Помилка підключення:', error);
            alert(t('joinRoom.errorConnection'));
            
            // Відновлюємо кнопку
            const joinBtn = this.element.querySelector('#join-btn');
            joinBtn.textContent = originalText;
            joinBtn.disabled = false;
        }
    }

    onBack() {
        stateManager.navigateTo('onlineMenu');
    }

    onPaste() {
        navigator.clipboard.readText().then(text => {
            const roomCodeInput = this.element.querySelector('#room-code');
            if (roomCodeInput) {
                roomCodeInput.value = text.trim().toUpperCase().substring(0, 6);
            }
        }).catch(err => {
            console.error('Помилка вставки:', err);
        });
    }
} 