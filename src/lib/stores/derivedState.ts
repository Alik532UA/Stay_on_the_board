// src/lib/stores/derivedState.ts
import { derived } from 'svelte/store';
import { gameState } from './gameState';
import type { GameState } from './gameState';
import type { Direction } from '$lib/gameCore';

/**
 * @typedef {object} ComputerMove
 * @property {Direction} direction
 * @property {number} distance
 */

/**
 * Derived store, що завжди містить останній хід комп'ютера.
 * Він автоматично оновлюється, коли змінюється gameState.moveQueue.
 * @type {import('svelte/store').Readable<ComputerMove | null>}
 */
export const lastComputerMove = derived(
  gameState,
  ($gameState: GameState) => {
    // Шукаємо з кінця черги останній хід, зроблений гравцем 2 (AI)
    for (let i = $gameState.moveQueue.length - 1; i >= 0; i--) {
      const move = $gameState.moveQueue[i];
      if (move.player === 2) {
        return { 
          direction: move.direction as Direction, 
          distance: move.distance 
        };
      }
    }
    return null; // Якщо комп'ютер ще не ходив
  }
); 