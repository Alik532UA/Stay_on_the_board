/**
 * @file Manages the scoring and points system for the current game.
 * @description Bridge pattern: writable-обгортка для Svelte 4 компонентів.
 * SSoT — scoreState.svelte.ts (Runes).
 */
// src/lib/stores/scoreStore.ts
import { writable } from 'svelte/store';
import { scoreState } from './scoreState.svelte';

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
  const { subscribe, set: svelteSet } = writable<ScoreState | null>(scoreState.state);

  const syncStore = () => {
    svelteSet(scoreState.state);
  };

  return {
    subscribe,
    set: (value: ScoreState | null) => {
      scoreState.state = value;
      syncStore();
    },
    update: (fn: (s: ScoreState | null) => ScoreState | null) => {
      scoreState.update(fn);
      syncStore();
    },
    addPenalty: (points: number) => {
      scoreState.addPenalty(points);
      syncStore();
    },
    // Інші мутатори для рахунку...
  };
}

export const scoreStore = createScoreStore();
