import { writable } from 'svelte/store';

const initialState = {
  isVisible: false,
  content: '',
  x: 0,
  y: 0,
};

const { subscribe, update, set } = writable(initialState);

export const tooltipStore = {
  subscribe,
  /**
   * @param {string} content HTML content for the tooltip
   * @param {number} x
   * @param {number} y
   */
  show: (content, x, y) => update(state => ({ ...state, isVisible: true, content, x, y })),
  
  /**
   * @param {number} x
   * @param {number} y
   */
  move: (x, y) => update(state => ({ ...state, x, y })),

  hide: () => set(initialState),
};