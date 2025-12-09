/**
 * @file Manages the state related to the game replay functionality.
 * It controls whether the replay mode is active, the current step, and auto-play settings.
 */
import { writable } from 'svelte/store';

/**
 * @typedef {Object} ReplayState
 * @property {boolean} isReplayMode
 * @property {any[]} moveHistory
 * @property {number} boardSize
 * @property {number} replayCurrentStep
 * @property {'paused' | 'forward' | 'backward'} autoPlayDirection
 * @property {boolean} limitReplayPath
 */

/** @type {ReplayState} */
const initialState = {
  isReplayMode: false,
  moveHistory: [],
  boardSize: 4,
  replayCurrentStep: 0,
  autoPlayDirection: 'paused',
  limitReplayPath: true,
};

const { subscribe, update, set } = writable(initialState);

export const replayStore = {
  subscribe,
  /**
   * @param {any[]} moveHistory
   * @param {number} boardSize
   */
  startReplay: (moveHistory, boardSize) => {
    update(state => ({
      ...state,
      isReplayMode: true,
      moveHistory,
      boardSize,
      replayCurrentStep: 0,
      autoPlayDirection: 'paused'
    }));
  },
  stopReplay: () => {
    update(state => ({
      ...state,
      isReplayMode: false,
      moveHistory: [],
      autoPlayDirection: 'paused'
    }));
  }
};
