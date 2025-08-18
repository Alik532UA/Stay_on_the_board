/**
 * @file Manages the transient state related to user input.
 * This includes selected direction, distance, and temporary displays for computer moves.
 * This state is often cleared or updated after each move.
 */
import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService.js';

/**
 * @typedef {'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'} Direction
 * @typedef {{direction: Direction, distance: number}} ComputerMove
 */

/**
 * @typedef {Object} PlayerInputState
 * @property {Direction | null} selectedDirection
 * @property {number | null} selectedDistance
 * @property {boolean} distanceManuallySelected
 * @property {boolean} isMoveInProgress // Додаємо прапорець для блокування введення
 */

/** @type {PlayerInputState} */
export const initialState = {
  selectedDirection: null,
  selectedDistance: null,
  distanceManuallySelected: false,
  isMoveInProgress: false, // Додаємо прапорець
};

const { subscribe, set, update } = writable(initialState);

/**
 * @param {PlayerInputState} newState
 */
function logStateChange(newState) {
  logService.state('playerInputStore updated', newState);
}

export const playerInputStore = {
  subscribe,
  /**
   * @param {PlayerInputState} value
   */
  set: (value) => {
    logStateChange(value);
    set(value);
  },
  /**
   * @param {(state: PlayerInputState) => PlayerInputState} updater
   */
  update: (updater) => {
    update(currentValue => {
      const newValue = updater(currentValue);
      logStateChange(newValue);
      return newValue;
    });
  }
};