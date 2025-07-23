/**
 * @file Manages the state related to the game replay functionality.
 * It controls whether the replay mode is active, the current step, and auto-play settings.
 */
import { writable } from 'svelte/store';

/**
 * @typedef {Object} ReplayState
 * @property {boolean} isReplayMode
 * @property {number} replayCurrentStep
 * @property {'paused' | 'forward' | 'backward'} autoPlayDirection
 * @property {boolean} limitReplayPath
 */

/** @type {ReplayState} */
const initialState = {
  isReplayMode: false,
  replayCurrentStep: 0,
  autoPlayDirection: 'paused',
  limitReplayPath: true,
};

export const replayStore = writable(initialState); 