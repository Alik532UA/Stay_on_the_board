import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService.js';

/**
 * @typedef {object} TooltipState
 * @property {boolean} isVisible
 * @property {string} content
 * @property {number} x
 * @property {number} y
 * @property {ReturnType<typeof setTimeout> | null} timeoutId
 * @property {HTMLElement | null} ownerNode
 */

/** @type {TooltipState} */
const initialState = {
  isVisible: false,
  content: '',
  x: 0,
  y: 0,
  timeoutId: null,
  ownerNode: null,
};

const { subscribe, update, set } = writable(initialState);

function cancelScheduledShow() {
  update(state => {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      logService.tooltip('[tooltipStore] Canceled scheduled show');
    }
    return { ...state, timeoutId: null, ownerNode: null }; // Also clear ownerNode
  });
}

export const tooltipStore = {
  subscribe,
  /**
   * @param {string} content HTML content for the tooltip
   * @param {number} x
   * @param {number} y
   * @param {number} delay
   * @param {HTMLElement} ownerNode
   */
  scheduleShow: (content, x, y, delay, ownerNode) => {
    cancelScheduledShow(); // Cancel any pending tooltip
    const timeoutId = setTimeout(() => {
      logService.tooltip('[tooltipStore] setTimeout callback. Checking owner node...', ownerNode);
      if (ownerNode && document.body.contains(ownerNode)) {
        logService.tooltip('[tooltipStore] Owner node is still in DOM. Showing tooltip.');
        update(state => ({ ...state, isVisible: true, content, x, y, timeoutId: null }));
      } else {
        logService.tooltip('[tooltipStore] Owner node is NOT in DOM. Aborting tooltip show.');
        update(state => ({ ...state, timeoutId: null, ownerNode: null }));
      }
    }, delay);
    
    update(state => ({ ...state, timeoutId, content, x, y, ownerNode }));
    logService.tooltip('[tooltipStore] show scheduled', { content, x, y, delay, ownerNode });
  },
  
  /**
   * @param {number} x
   * @param {number} y
   */
  move: (x, y) => {
      update(state => ({ ...state, x, y }));
  },

  hide: () => {
    logService.tooltip('[tooltipStore] hide called');
    cancelScheduledShow();
    set(initialState);
  },

  /**
   * Hides the tooltip only if it is visible and belongs to the specified owner.
   * @param {HTMLElement} ownerNode 
   */
  hideIfOwner: (ownerNode) => {
    update(state => {
      if (state.isVisible && state.ownerNode === ownerNode) {
        logService.tooltip('[tooltipStore] hideIfOwner called for matching owner. Hiding.', ownerNode);
        return initialState;
      }
      return state;
    });
  },

  /**
   * Cancels a scheduled tooltip only if it belongs to the specified owner.
   * @param {HTMLElement} ownerNode
   */
  cancelForOwner: (ownerNode) => {
    update(state => {
      if (state.timeoutId && state.ownerNode === ownerNode) {
        logService.tooltip('[tooltipStore] cancelForOwner called for matching owner. Canceling.', ownerNode);
        clearTimeout(state.timeoutId);
        return initialState; // Reset state completely
      }
      return state;
    });
  },
};
