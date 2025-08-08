import { writable } from 'svelte/store';

/**
 * Інтерфейс для результатів гри
 */
export interface GameResult {
  score: {
    player1: number;
    player2: number;
  };
  winner: 'player1' | 'player2' | 'draw' | null;
  reasonKey: string | null;
  reasonValues: Record<string, any> | null;
  finalScoreDetails?: {
    baseScore: number;
    sizeBonus: number;
    blockModeBonus: number;
    jumpBonus: number;
    finishBonus: number;
    noMovesBonus: number;
    totalPenalty: number;
    totalScore: number;
  };
  gameType: 'local' | 'vs-computer';
}

/**
 * Інтерфейс для стану завершення гри
 */
export interface GameOverState {
  isGameOver: boolean;
  gameResult: GameResult | null;
  setGameOver: (result: GameResult) => void;
  resetGameOverState: () => void;
  clearGameOverState: () => void;
}

/**
 * Глобальний стор для збереження стану завершення гри
 * Цей стор забезпечує персистентність даних при переходах між сторінками
 */
const createGameOverStore = () => {
  const { subscribe, set, update } = writable<GameOverState>({
    isGameOver: false,
    gameResult: null,
    setGameOver: () => {}, // Буде встановлено нижче
    resetGameOverState: () => {}, // Буде встановлено нижче
    clearGameOverState: () => {}, // Буде встановлено нижче
  });

  return {
    subscribe,
    setGameOver: (result: GameResult) => {
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
    restoreState: (newState: GameOverState) => {
      set(newState);
    }
  };
};

export const gameOverStore = createGameOverStore(); 