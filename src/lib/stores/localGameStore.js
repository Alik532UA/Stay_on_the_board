// @ts-check

import { writable } from 'svelte/store';
import { logService } from '../services/logService.js';

/**
 * @typedef {Object} BonusEntry
 * @property {number} points - Кількість бонусних балів
 * @property {string} reason - Причина нарахування
 * @property {number} timestamp - Час нарахування
 */

/**
 * @typedef {Object} Player
 * @property {number} id - Унікальний ідентифікатор гравця
 * @property {string} name - Ім'я гравця
 * @property {string} color - Колір гравця
 * @property {number} score - Рахунок гравця
 * @property {boolean} isComputer - Чи є гравець комп'ютером
 * @property {number} penaltyPoints - Штрафні бали
 * @property {number} bonusPoints - Бонусні бали
 * @property {BonusEntry[]} bonusHistory - Історія бонусних балів
*/

/**
 * @typedef {Object} GameSettings
 * @property {number} boardSize - Розмір дошки
 * @property {boolean} blockModeEnabled - Режим блокування
 * @property {boolean} autoHideBoard - Автоматичне приховування дошки
 * @property {boolean} lockSettings - Блокування налаштувань
 */

/**
 * @typedef {Object} LocalGameState
 * @property {Player[]} players - Список гравців
 * @property {GameSettings} settings - Налаштування гри
 * @property {number[]} scoresAtRoundStart - Рахунки на початок раунду
*/

// Функція для генерації унікального ID
const generateId = () => Date.now() + Math.random();

// Масив доступних кольорів
const availableColors = [
  '#e63946', // червоний
  '#457b9d', // синій
  '#2a9d8f', // зелений
  '#f4a261', // помаранчевий
  '#e76f51', // кораловий
  '#9b5de5', // фіолетовий
  '#f15bb5', // рожевий
  '#00bbf9'  // голубий
];

// Функція для отримання випадкового кольору
const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  return availableColors[randomIndex];
};

const availableNames = [
  'Alik', 'Noah', 'Jack', 'Mateo', 'Lucas', 'Sofia', 'Olivia', 'Nora', 'Lucia', 'Emilia'
];

/**
 * @param {string[]} usedNames - Масив імен, які вже використовуються
 * @returns {string} Випадкове ім'я, яке ще не використовується
 */
const getRandomUnusedName = (usedNames) => {
  const unusedNames = availableNames.filter(name => !usedNames.includes(name));
  if (unusedNames.length === 0) {
    return `Гравець ${usedNames.length + 1}`;
  }
  const randomIndex = Math.floor(Math.random() * unusedNames.length);
  return unusedNames[randomIndex];
};

// Функція для отримання випадкового кольору, який ще не використовується
/**
 * @param {string[]} usedColors - Масив кольорів, які вже використовуються
 * @returns {string} Випадковий колір, який ще не використовується
 */
const getRandomUnusedColor = (usedColors) => {
  const unusedColors = availableColors.filter(color => !usedColors.includes(color));
  if (unusedColors.length === 0) {
    // Якщо всі кольори використані, повертаємо випадковий
    return getRandomColor();
  }
  const randomIndex = Math.floor(Math.random() * unusedColors.length);
  return unusedColors[randomIndex];
};

// Початковий стан (Single Source of Truth)
/**
 * Створює початковий стан гри
 * @returns {LocalGameState}
 */
const createInitialState = () => {
  const player1Color = getRandomColor();
  const player2Color = getRandomUnusedColor([player1Color]);
  const player3Color = getRandomUnusedColor([player1Color, player2Color]);
  const player4Color = getRandomUnusedColor([player1Color, player2Color, player3Color]);
  
  return {
    players: [
      { id: generateId(), name: 'den', color: player1Color, score: 0, isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: /** @type {BonusEntry[]} */ ([]) },
      { id: generateId(), name: 'Khaaaa', color: player2Color, score: 0, isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: /** @type {BonusEntry[]} */ ([]) },
      { id: generateId(), name: 'Destroyter94', color: player3Color, score: 0, isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: /** @type {BonusEntry[]} */ ([]) },
      { id: generateId(), name: 'MrGrom', color: player4Color, score: 0, isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: /** @type {BonusEntry[]} */ ([]) }
    ],
    scoresAtRoundStart: [0, 0, 0, 0],
    settings: {
      boardSize: 4,
      blockModeEnabled: false,
      autoHideBoard: false,
      lockSettings: false
    }
  };
};

function createLocalGameStore() {
  const { subscribe, update, set } = writable(createInitialState());

  return {
    subscribe,
    
    // --- Методи для керування гравцями ---

    /** Додає нового гравця до списку */
    addPlayer: () => {
      update(state => {
        if (state.players.length >= 8) return state; // Обмеження на кількість гравців
        
        // Отримуємо кольори, які вже використовуються
        const usedColors = state.players.map(p => p.color);
        
        const newPlayer = {
          id: generateId(),
          name: getRandomUnusedName(state.players.map(p => p.name)),
          color: getRandomUnusedColor(usedColors),
          score: 0,
          isComputer: false,
          penaltyPoints: 0,
          bonusPoints: 0,
          bonusHistory: /** @type {BonusEntry[]} */ ([])
        };
        return {
          ...state,
          players: [...state.players, newPlayer]
        };
      });
    },

    /** 
     * Додає нового гравця з конкретними даними (ім'я та колір)
     * @param {string} name - Ім'я гравця
     * @param {string} color - Колір гравця
     */
    addPlayerWithData: (name, color) => {
      update(state => {
        if (state.players.length >= 8) return state; // Обмеження на кількість гравців
        
        const newPlayer = {
          id: generateId(),
          name: name,
          color: color,
          score: 0,
          isComputer: false,
          penaltyPoints: 0,
          bonusPoints: 0,
          bonusHistory: /** @type {BonusEntry[]} */ ([])
        };
        return {
          ...state,
          players: [...state.players, newPlayer]
        };
      });
    },

    /** 
     * Видаляє гравця за його ID 
     * @param {number} playerId - ID гравця для видалення
     */
    removePlayer: (playerId) => {
      update(state => {
        if (state.players.length <= 2) return state; // Мінімальна кількість гравців
        return {
          ...state,
          players: state.players.filter(p => p.id !== playerId)
        };
      });
    },

    /** 
     * Оновлює дані гравця (ім'я або колір) 
     * @param {number} playerId - ID гравця
     * @param {Object} updatedData - Нові дані гравця
     */
    updatePlayer: (playerId, updatedData) => {
      logService.state('localGameStore: updatePlayer called with', playerId, updatedData);
      update(state => {
        logService.state('localGameStore: current state before update', state);
        const newState = {
          ...state,
          players: state.players.map(p => 
            p.id === playerId ? { ...p, ...updatedData } : p
          )
        };
        logService.state('localGameStore: new state after update', newState);
        return newState;
      });
    },

    /** 
     * Оновлює рахунок гравця 
     * @param {number} playerId - ID гравця
     * @param {number} newScore - Новий рахунок
     */
    updatePlayerScore: (playerId, newScore) => {
      update(state => {
        return {
          ...state,
          players: state.players.map(p => 
            p.id === playerId ? { ...p, score: newScore } : p
          )
        };
      });
    },

    /** 
     * Додає бали до рахунку гравця 
     * @param {number} playerId - ID гравця
     * @param {number} pointsToAdd - Кількість балів для додавання
     */
    addPlayerScore: (playerId, pointsToAdd) => {
      logService.score(`localGameStore.addPlayerScore: додаємо ${pointsToAdd} балів гравцю з ID ${playerId}`);
      update(state => {
        const updatedState = {
          ...state,
          players: state.players.map(p => 
            p.id === playerId ? { ...p, score: p.score + pointsToAdd } : p
          )
        };
        const updatedPlayer = updatedState.players.find(p => p.id === playerId);
        logService.score(`localGameStore.addPlayerScore: рахунок гравця ${updatedPlayer?.name} оновлено до ${updatedPlayer?.score}`);
        return updatedState;
      });
    },

    /** 
     * Додає штрафні бали до рахунку гравця 
     * @param {number} playerId - ID гравця
     * @param {number} penaltyPointsToAdd - Кількість штрафних балів для додавання
     */
    addPlayerPenaltyPoints: (playerId, penaltyPointsToAdd) => {
      logService.score(`localGameStore.addPlayerPenaltyPoints: додаємо ${penaltyPointsToAdd} штрафних балів гравцю з ID ${playerId}`);
      update(state => {
        const updatedState = {
          ...state,
          players: state.players.map(p => 
            p.id === playerId ? { ...p, penaltyPoints: p.penaltyPoints + penaltyPointsToAdd } : p
          )
        };
        const updatedPlayer = updatedState.players.find(p => p.id === playerId);
        logService.score(`localGameStore.addPlayerPenaltyPoints: штрафні бали гравця ${updatedPlayer?.name} оновлено до ${updatedPlayer?.penaltyPoints}`);
        return updatedState;
      });
    },

    /** 
     * Додає бонусні бали до рахунку гравця 
     * @param {number} playerId - ID гравця
     * @param {number} bonusPointsToAdd - Кількість бонусних балів для додавання
     * @param {string} reason - Причина нарахування бонусних балів
     */
    addPlayerBonusPoints: (playerId, bonusPointsToAdd, reason = '') => {
      logService.score(`localGameStore.addPlayerBonusPoints: додаємо ${bonusPointsToAdd} бонусних балів гравцю з ID ${playerId} за: ${reason}`);
      update(state => {
        const updatedState = {
          ...state,
          players: state.players.map(p => 
            p.id === playerId ? { 
              ...p, 
              bonusPoints: p.bonusPoints + bonusPointsToAdd,
              bonusHistory: [...p.bonusHistory, {
                points: bonusPointsToAdd,
                reason: reason,
                timestamp: Date.now()
              }]
            } : p
          )
        };
        const updatedPlayer = updatedState.players.find(p => p.id === playerId);
        logService.score(`localGameStore.addPlayerBonusPoints: бонусні бали гравця ${updatedPlayer?.name} оновлено до ${updatedPlayer?.bonusPoints}`);
        return updatedState;
      });
    },

    /** Скидає рахунки всіх гравців */
    resetScores: () => {
      update(state => {
        return {
          ...state,
          players: state.players.map(p => ({ ...p, score: 0, isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: /** @type {BonusEntry[]} */ ([]) }))
        };
      });
    },

    // --- Методи для керування налаштуваннями ---

    /** 
     * Оновлює налаштування гри 
     * @param {Object} newSettings - Нові налаштування
     */
    updateSettings: (newSettings) => {
      update(state => {
        return {
          ...state,
          settings: { ...state.settings, ...newSettings }
        };
      });
    },

    /**
     * Зберігає рахунки всіх гравців на початок раунду
     */
    snapshotScores: () => {
      update(state => {
        const scores = state.players.map(p => p.bonusPoints - p.penaltyPoints);
        logService.state('localGameStore: snapshotting scores', scores);
        return { ...state, scoresAtRoundStart: scores };
      });
    },

    /** Скидає стан до початкового */
    resetStore: () => {
      set(createInitialState());
    },


    /** Відновлює стан з збережених даних */
    restoreState: (/** @type {LocalGameState} */ savedState) => {
      set(savedState);
    },

    /** 
     * Скидає рахунки гравців, зберігаючи їх імена та кольори
     * @param {Array<{name: string, color: string}>} playersData - Дані гравців для збереження
     */
    resetPlayersWithData: (playersData) => {
      update(state => {
        const resetPlayers = playersData.map((playerData, index) => ({
          id: generateId(),
          name: playerData.name,
          color: playerData.color,
          score: 0,
          isComputer: false,
          penaltyPoints: 0,
          bonusPoints: 0,
          bonusHistory: /** @type {BonusEntry[]} */ ([])
        }));
        
        return {
          ...state,
          players: resetPlayers
        };
      });
    }
  };
}

export const localGameStore = createLocalGameStore(); 