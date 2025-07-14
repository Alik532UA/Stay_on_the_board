import { writable } from 'svelte/store';

/**
 * @typedef {Object} ModalButton
 * @property {string} text
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 */
/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen
 * @property {string} title
 * @property {string} content
 * @property {ModalButton[]} buttons
 */

const initialState = {
  isOpen: false,
  title: '',
  content: '',
  buttons: []
};

const { subscribe, set, update } = writable(/** @type {ModalState} */ ({ ...initialState }));

/**
 * @param {{ title: string, content: string, buttons?: ModalButton[] }} param0
 */
function showModal({ title, content, buttons = [] }) {
  set({ isOpen: true, title, content, buttons });
}

function closeModal() {
  set({ ...initialState });
}

export const modalStore = {
  subscribe,
  showModal,
  closeModal
}; 