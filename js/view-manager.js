// === VIEW MANAGER ===
// Покращений менеджер відображення з реактивністю

import { stateManager } from './state-manager.js';
import { t } from './localization.js';
import { MainMenuComponent } from './components/main-menu-component.js';
import { SettingsComponent } from './components/settings-component.js';
import { ModalComponent } from './components/modal-component.js';
import { GameBoardComponent } from './components/game-board-component.js';
import { GameControlsComponent } from './components/game-controls-component.js';
import { OnlineMenuComponent } from './components/online-menu-component.js';
import { WaitingForPlayerComponent } from './components/waiting-for-player-component.js';
import { JoinRoomComponent } from './components/join-room-component.js';
import { gameLogic } from './game-logic-new.js';

export class ViewManager {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.currentComponent = null;
    
    // Створюємо глобальний екземпляр ModalComponent для відображення модальних вікон
    this.modalContainer = document.createElement('div');
    this.modalContainer.id = 'modal-container';
    this.modalContainer.style.position = 'fixed';
    this.modalContainer.style.top = '0';
    this.modalContainer.style.left = '0';
    this.modalContainer.style.width = '100%';
    this.modalContainer.style.height = '100%';
    this.modalContainer.style.zIndex = '9999';
    this.modalContainer.style.pointerEvents = 'none';
    document.body.appendChild(this.modalContainer);
    
    this.modalComponent = new ModalComponent(this.modalContainer);
  }

  navigateTo(viewName, params = {}) {
    Logger.debug('[ViewManager] navigateTo:', { viewName, params });
    
    let ComponentClass;
    
    switch (viewName) {
      case 'mainMenu':
        ComponentClass = MainMenuComponent;
        break;
      case 'settings':
        ComponentClass = SettingsComponent;
        break;
      case 'gameBoard':
        ComponentClass = GameBoardComponent;
        break;
      case 'onlineMenu':
        ComponentClass = OnlineMenuComponent;
        break;
      case 'waitingForPlayer':
        ComponentClass = WaitingForPlayerComponent;
        break;
      case 'joinRoom':
        ComponentClass = JoinRoomComponent;
        break;
      default:
        Logger.error('[ViewManager] Невідомий view:', viewName);
        return;
    }
    
    this.render(viewName, ComponentClass, params);
  }

  render(viewName, ComponentClass, params = {}) {
    Logger.debug('[ViewManager] render:', { viewName, params });
    
    if (this.currentComponent && this.currentComponent.detachEventListeners) {
      this.currentComponent.detachEventListeners();
    }
    
    this.appContainer.innerHTML = '';
    const el = document.createElement('div');
    this.appContainer.appendChild(el);
    
    this.currentComponent = new ComponentClass(el);
    
    // Передаємо параметри компоненту
    if (params && Object.keys(params).length > 0) {
      Object.assign(this.currentComponent, params);
    }
    
    if (this.currentComponent.render) {
      this.currentComponent.render();
      
      // Якщо рендеримо головне меню — підвішуємо глобальні обробники
      if (viewName === 'mainMenu' && window.app && typeof window.app.setupGlobalControls === 'function') {
        window.app.setupGlobalControls();
      }
    }
    
    // Показуємо/приховуємо game-controls залежно від view
    this.toggleGameControls(viewName);
  }
  
  toggleGameControls(viewName) {
    const gameControlsElement = document.getElementById('game-controls');
    if (gameControlsElement) {
      // Показуємо game-controls тільки на ігрових екранах
      const isGameView = viewName === 'gameBoard' || viewName === 'localGame';
      gameControlsElement.style.display = isGameView ? 'block' : 'none';
      
      Logger.debug('[ViewManager] Game controls visibility:', { viewName, isGameView });
      
      // Якщо приховуємо контроли, очищаємо їх вміст
      if (!isGameView) {
        gameControlsElement.innerHTML = '';
        Logger.debug('[ViewManager] Game controls content cleared');
      }
    } else {
      Logger.error('[ViewManager] Game controls element not found');
    }
  }
}

export const viewManager = new ViewManager(); 