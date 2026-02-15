// src/lib/stores/gameOverStore.ts
// Bridge pattern: writable-обгортка для Svelte 4 компонентів.
// SSoT — gameOverState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import type { Player } from '$lib/models/player';
import { gameOverState } from './gameOverState.svelte';

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

const createGameOverStore = () => {
  const { subscribe, set: svelteSet } = writable<GameOverStoreState>(gameOverState.state);

  const syncStore = () => {
    svelteSet(gameOverState.state);
  };

  return {
    subscribe,
    setGameOver: (result: GameOverPayload) => {
      gameOverState.setGameOver(result);
      syncStore();
    },
    resetGameOverState: () => {
      gameOverState.resetGameOverState();
      syncStore();
    },
    clearGameOverState: () => {
      gameOverState.clearGameOverState();
      syncStore();
    },
    restoreState: (newState: GameOverStoreState) => {
      gameOverState.restoreState(newState);
      syncStore();
    }
  };
};

export const gameOverStore = createGameOverStore();
