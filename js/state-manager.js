// === STATE MANAGER ===
// Централізоване управління станом додатку

import { viewManager } from './view-manager.js';

const initialState = {
  ui: {
    currentView: 'mainMenu',
    modal: {
      isOpen: false,
      title: '',
      content: '',
      buttons: []
    },
  },
  settings: {
    language: localStorage.getItem('lang') || 'uk',
    speechEnabled: localStorage.getItem('speechEnabled') === 'true' || false,
    theme: localStorage.getItem('theme') || 'dark',
    style: localStorage.getItem('style') || 'classic',
    showMoves: localStorage.getItem('showMoves') !== 'false', // За замовчуванням true, якщо не встановлено false
    showBoard: localStorage.getItem('showBoard') !== 'false', // За замовчуванням true, якщо не встановлено false
    blockedMode: localStorage.getItem('blockedMode') === 'true', // ВАЖЛИВО: без || false, щоб не було автоскидання
  },
  game: {
    boardSize: 3,
    board: null,
    currentPlayer: 1,
    points: 0,
    // ...інші налаштування
  },
};

const listeners = {};

function navigateTo(viewName, params = {}) {
  console.log('[StateManager] navigateTo:', viewName, params);
  setState('ui.currentView', viewName);
  viewManager.navigateTo(viewName, params);
}

const stateManager = {
  setState,
  getState,
  subscribe,
  navigateTo,
  showModal(title, content, buttons = []) {
    console.log('[StateManager] showModal:', title);
    setState('ui.modal', { isOpen: true, title, content, buttons });
  },
  hideModal() {
    console.log('[StateManager] hideModal');
    setState('ui.modal.isOpen', false);
  },
  updateBoard(newBoard) {
    console.log('[StateManager] updateBoard called with board size:', newBoard.length);
    this.setState('game.board', newBoard);
  },
  addMoveToHistory(move) {
    console.log('[StateManager] addMoveToHistory:', move);
    const history = this.getState('game.moveHistory') || [];
    history.push(move);
    this.setState('game.moveHistory', history);
  },
};

export { stateManager };

export function setState(path, value) {
  console.log('[StateManager] setState:', path, '=', value);
  const keys = path.split('.');
  let obj = initialState;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {}; // Додаю створення проміжних об'єктів
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  
  // Автоматично зберігаємо налаштування в localStorage
  if (path.startsWith('settings.')) {
    const settingKey = path.split('.')[1];
    localStorage.setItem(settingKey, value.toString());
  }
  
  if (listeners[path]) {
    console.log('[StateManager] Notifying listeners for:', path, 'count:', listeners[path].length);
    listeners[path].forEach(fn => {
      try {
        fn(value);
      } catch (error) {
        console.error('[StateManager] Error in listener for', path, ':', error);
      }
    });
  }
  
  // Сповіщаємо підписників на батьківські об'єкти
  const pathParts = path.split('.');
  for (let i = pathParts.length - 1; i > 0; i--) {
    const parentPath = pathParts.slice(0, i).join('.');
    if (listeners[parentPath]) {
      const parentState = getState(parentPath);
      listeners[parentPath].forEach(fn => {
        try {
          fn(parentState);
        } catch (error) {
          console.error('[StateManager] Error in parent listener for', parentPath, ':', error);
        }
      });
    }
  }
}

export function getState(path) {
  const keys = path.split('.');
  let obj = initialState;
  for (let k of keys) {
    obj = obj[k];
    if (obj === undefined) return undefined;
  }
  return obj;
}

export function subscribe(path, fn) {
  console.log('[StateManager] subscribe:', path);
  if (!listeners[path]) listeners[path] = [];
  listeners[path].push(fn);
  // Повертає unsubscribe
  return () => {
    if (listeners[path]) {
      listeners[path] = listeners[path].filter(f => f !== fn);
    }
  };
}

stateManager.updateSettings = function (settings) {
  console.log('[StateManager] updateSettings:', settings);
  let changed = false;
  if (settings.theme && initialState.settings.theme !== settings.theme) {
    initialState.settings.theme = settings.theme;
    localStorage.setItem('theme', settings.theme);
    if (listeners['settings.theme']) listeners['settings.theme'].forEach(fn => fn(settings.theme));
    changed = true;
  }
  if (settings.style && initialState.settings.style !== settings.style) {
    initialState.settings.style = settings.style;
    localStorage.setItem('style', settings.style);
    if (listeners['settings.style']) listeners['settings.style'].forEach(fn => fn(settings.style));
    changed = true;
  }
  if (settings.showMoves !== undefined && initialState.settings.showMoves !== settings.showMoves) {
    initialState.settings.showMoves = settings.showMoves;
    localStorage.setItem('showMoves', settings.showMoves.toString());
    if (listeners['settings.showMoves']) listeners['settings.showMoves'].forEach(fn => fn(settings.showMoves));
    changed = true;
  }
  if (settings.showBoard !== undefined && initialState.settings.showBoard !== settings.showBoard) {
    initialState.settings.showBoard = settings.showBoard;
    localStorage.setItem('showBoard', settings.showBoard.toString());
    if (listeners['settings.showBoard']) listeners['settings.showBoard'].forEach(fn => fn(settings.showBoard));
    changed = true;
  }
  if (settings.speechEnabled !== undefined && initialState.settings.speechEnabled !== settings.speechEnabled) {
    initialState.settings.speechEnabled = settings.speechEnabled;
    localStorage.setItem('speechEnabled', settings.speechEnabled.toString());
    if (listeners['settings.speechEnabled']) listeners['settings.speechEnabled'].forEach(fn => fn(settings.speechEnabled));
    changed = true;
  }
  if (settings.blockedMode !== undefined && initialState.settings.blockedMode !== settings.blockedMode) {
    initialState.settings.blockedMode = settings.blockedMode;
    localStorage.setItem('blockedMode', settings.blockedMode.toString());
    if (listeners['settings.blockedMode']) listeners['settings.blockedMode'].forEach(fn => fn(settings.blockedMode));
    changed = true;
  }
  console.log('[StateManager] updateSettings changed:', changed);
  return changed;
}; 