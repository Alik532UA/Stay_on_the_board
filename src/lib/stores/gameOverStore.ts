import { writable } from 'svelte/store';

/**
 * Інтерфейс для результатів гри
 */

/**
 * Глобальний стор для збереження стану завершення гри
 * Цей стор забезпечує персистентність даних при переходах між сторінками
 */
const createGameOverStore = () => {
  const { subscribe, set, update } = writable<any>({
    isGameOver: false,
    gameResult: null,
    setGameOver: () => {}, // Буде встановлено нижче
    resetGameOverState: () => {}, // Буде встановлено нижче
    clearGameOverState: () => {}, // Буде встановлено нижче
  });

  return {
    subscribe,
    setGameOver: (result: any) => {
      update(state => ({
        ...state,
        isGameOver: true,
        gameResult: result,
      }));
    },
    resetGameOverState: () => {
      update(state => ({
        ...state,
        isGameOver: false,
        gameResult: null,
      }));
    },
    clearGameOverState: () => {
      update(state => ({
        ...state,
        isGameOver: false,
        gameResult: null,
      }));
    },
    // НОВИЙ МЕТОД для відновлення стану
    restoreState: (newState: any) => {
      set(newState);
    }
  };
};

export const gameOverStore = createGameOverStore(); 
