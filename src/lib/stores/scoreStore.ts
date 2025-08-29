/**
 * @file Manages the scoring and points system for the current game.
 * @description This store tracks all variables related to the player's score,
 * including penalty points, bonuses, and other metrics. It is initialized as null
 * and set up when a game starts.
 */
// src/lib/stores/scoreStore.ts
import { writable } from 'svelte/store';

export interface ScoreState {
  penaltyPoints: number;
  movesInBlockMode: number;
  jumpedBlockedCells: number;
  noMovesBonus: number;
  distanceBonus: number;
  // ... та інші поля, пов'язані з рахунком
}

export const initialScoreState: ScoreState = {
  penaltyPoints: 0,
  movesInBlockMode: 0,
  jumpedBlockedCells: 0,
  noMovesBonus: 0,
  distanceBonus: 0,
};

function createScoreStore() {
  const { subscribe, set, update } = writable<ScoreState | null>(null);

  return {
    subscribe,
    set,
    update,
    addPenalty: (points: number) => {
      update(state => {
        if (!state) return null;
        return { ...state, penaltyPoints: state.penaltyPoints + points };
      });
    },
    // Інші мутатори для рахунку...
  };
}

export const scoreStore = createScoreStore();