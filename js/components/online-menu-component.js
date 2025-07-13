import { BaseComponent } from './base-component.js';
import { t } from '../localization.js';
import { stateManager } from '../state-manager.js';

export class OnlineMenuComponent extends BaseComponent {
    constructor(props = {}) {
        super(props);
        this.state = {
            ...props,
            // Можна додати додаткові поля стану
        };
        this.handleCreateRoom = this.handleCreateRoom.bind(this);
        this.handleJoinRoom = this.handleJoinRoom.bind(this);
        this.handleBack = this.handleBack.bind(this);
    }

    async handleCreateRoom() {
        try {
            // Генеруємо ID кімнати
            const roomId = this.generateRoomId();
            
            // Ініціалізуємо WebRTC
            if (!window.webrtcManager) {
                throw new Error('WebRTC Manager не доступний');
            }
            
            await window.webrtcManager.initialize('Хост');
            await window.webrtcManager.createRoom(roomId);
            
            // Налаштовуємо обробники подій
            window.webrtcManager.onConnectionEstablished = () => {
                console.log('[OnlineMenuComponent] Гість підключився');
                stateManager.navigateTo('gameBoard');
            };
            
            // Переходимо до екрану очікування
            stateManager.navigateTo('waitingForPlayer', { roomId });
            
        } catch (error) {
            console.error('[OnlineMenuComponent] Помилка створення кімнати:', error);
            alert(t('onlineMenu.errorCreateRoom'));
        }
    }

    handleJoinRoom() {
        // Переходимо до екрану введення коду
        stateManager.navigateTo('joinRoom');
    }

    handleBack() {
        stateManager.navigateTo('mainMenu');
    }

    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    render() {
        return `
            <div class="online-menu-panel">
                <h2 class="online-menu-title">${t('onlineMenu.title')}</h2>
                <p class="online-menu-desc">${t('onlineMenu.description')}</p>
                <div class="online-menu-actions">
                    <button class="modal-button primary" id="create-room-btn">${t('onlineMenu.createRoom')}</button>
                    <button class="modal-button secondary" id="join-room-btn">${t('onlineMenu.joinRoom')}</button>
                </div>
                <button class="modal-button" id="back-btn">${t('onlineMenu.back')}</button>
            </div>
        `;
    }

    afterRender() {
        this.find('#create-room-btn')?.addEventListener('click', this.handleCreateRoom);
        this.find('#join-room-btn')?.addEventListener('click', this.handleJoinRoom);
        this.find('#back-btn')?.addEventListener('click', this.handleBack);
    }
} 