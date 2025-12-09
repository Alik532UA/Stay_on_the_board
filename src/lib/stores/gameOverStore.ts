import { writable } from 'svelte/store';
import type { Player } from '$lib/models/player';

/**
 * Деталі фінального рахунку
 */
export interface FinalScoreDetails {
  baseScore: number;
  totalPenalty: number;
  sizeBonus?: number;
  blockModeBonus?: number;
  jumpBonus?: number;
  noMovesBonus?: number;
  finishBonus?: number;
  distanceBonus?: number;
  totalScore: number;
}

/**
 * Результат гравця (для відображення в модальному вікні)
 */
export interface PlayerScoreResult {
  playerId: number;
  score: number;
  name: string;
  color: string;
}

/**
 * Результат гри (payload для setGameOver)
 */
export interface GameOverPayload {
  scores: PlayerScoreResult[];
  winners: Player[];
  loser: Player | null;
  reasonKey: string;
  reasonValues: Record<string, string | number> | null;
  finalScoreDetails: FinalScoreDetails;
  gameType: 'training' | 'local' | 'timed' | 'online' | 'virtual-player';
}

/**
 * Стан gameOverStore
 */
export interface GameOverStoreState {
  isGameOver: boolean;
  gameResult: GameOverPayload | null;
}

/**
 * Глобальний стор для збереження стану завершення гри
 * Цей стор забезпечує персистентність даних при переходах між сторінками
 */
const createGameOverStore = () => {
  const { subscribe, set, update } = writable<GameOverStoreState>({
    isGameOver: false,
    gameResult: null,
  });

  return {
    subscribe,
    setGameOver: (result: GameOverPayload) => {
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
    restoreState: (newState: GameOverStoreState) => {
      set(newState);
    }
  };
};

export const gameOverStore = createGameOverStore();

