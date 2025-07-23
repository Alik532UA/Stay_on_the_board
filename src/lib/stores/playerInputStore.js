/**
 * @file Manages the transient state related to user input.
 * This includes selected direction, distance, and temporary displays for computer moves.
 * This state is often cleared or updated after each move.
 */
import { writable } from 'svelte/store';

/**
 * @typedef {'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'} Direction
 * @typedef {{direction: Direction, distance: number}} ComputerMove
 */

/**
 * @typedef {Object} PlayerInputState
 * @property {Direction | null} selectedDirection
 * @property {number | null} selectedDistance
 * @property {boolean} distanceManuallySelected
 * @property {ComputerMove | null} lastComputerMove
 * @property {boolean} isMoveInProgress // Додаємо прапорець для блокування введення
 */

/** @type {PlayerInputState} */
const initialState = {
  selectedDirection: null,
  selectedDistance: null,
  distanceManuallySelected: false,
  lastComputerMove: null,
  isMoveInProgress: false, // Додаємо прапорець
};

export const playerInputStore = writable(initialState); 