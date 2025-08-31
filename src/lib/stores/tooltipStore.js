import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService.js';

/**
 * @typedef {object} TooltipState
 * @property {boolean} isVisible
 * @property {string} content
 * @property {number} x
 * @property {number} y
 * @property {ReturnType<typeof setTimeout> | null} timeoutId
 */

/** @type {TooltipState} */
const initialState = {
  isVisible: false,
  content: '',
  x: 0,
  y: 0,
  timeoutId: null,
};

const { subscribe, update, set } = writable(initialState);

function cancelScheduledShow() {
  update(state => {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      logService.tooltip('[tooltipStore] Canceled scheduled show');
    }
    return { ...state, timeoutId: null };
  });
}

export const tooltipStore = {
  subscribe,
  /**
   * @param {string} content HTML content for the tooltip
   * @param {number} x
   * @param {number} y
   * @param {number} delay
   */
  scheduleShow: (content, x, y, delay) => {
    cancelScheduledShow(); // Cancel any pending tooltip
    const timeoutId = setTimeout(() => {
      logService.tooltip('[tooltipStore] setTimeout callback: showing tooltip');
      update(state => ({ ...state, isVisible: true, content, x, y, timeoutId: null }));
    }, delay);
    
    update(state => ({ ...state, timeoutId, content, x, y }));
    logService.tooltip('[tooltipStore] show scheduled', { content, x, y, delay });
  },
  
  /**
   * @param {number} x
   * @param {number} y
   */
  move: (x, y) => {
      update(state => ({ ...state, x, y }));
  },

  hide: () => {
    logService.tooltip('[tooltipStore] hide called, canceling scheduled show and hiding');
    cancelScheduledShow();
    set(initialState);
  },
};