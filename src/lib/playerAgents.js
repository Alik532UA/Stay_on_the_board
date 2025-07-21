import * as core from './gameCore.js';
import { settingsStore } from './stores/settingsStore.js';
import { get } from 'svelte/store';

/**
 * @typedef {import('./stores/gameStore').AppState} AppState
 */

/**
 * Повертає випадковий валідний хід для комп'ютера.
 * @param {AppState} state - Поточний стан гри.
 * @returns {any | null} // тип Move не експортується, тому any
 */
function getComputerMove(state) {
  const { board, cellVisitCounts, boardSize, playerRow, playerCol } = state;
  const { blockOnVisitCount } = get(settingsStore);
  if (playerRow === null || playerCol === null) return null;
  const moves = core.getAvailableMoves(playerRow, playerCol, boardSize, cellVisitCounts, blockOnVisitCount);
  if (!moves.length) return null;

  const chosenMove = moves[Math.floor(Math.random() * moves.length)];

  // Розраховуємо напрямок і відстань
  const dr = chosenMove.row - playerRow;
  const dc = chosenMove.col - playerCol;
  const distance = Math.max(Math.abs(dr), Math.abs(dc));
  
  let direction = null;
  const sdr = Math.sign(dr);
  const sdc = Math.sign(dc);

  // Знаходимо відповідний напрямок у dirMap
  for (const [dir, [dirR, dirC]] of Object.entries(core.dirMap)) {
    if (sdr === dirR && sdc === dirC) {
      direction = dir;
      break;
    }
  }

  return { ...chosenMove, direction, distance };
}

export const agents = {
  ai: {
    /**
     * @param {AppState} state
     * @returns {Promise<any | null>}
     */
    getMove: (state) => Promise.resolve(getComputerMove(state))
  }
}; 