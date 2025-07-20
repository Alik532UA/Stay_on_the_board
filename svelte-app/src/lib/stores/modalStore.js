import { writable } from 'svelte/store';

/**
 * @typedef {Object} ModalButton
 * @property {string} [text]
 * @property {string} [textKey]
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 * @property {string} [customClass]
 * @property {boolean} [isHot]
 * @property {string} [hotKey]
 */
/**
 * @typedef {Object} ModalContent
 * @property {string} [reason]
 * @property {number} [score]
 * @property {any} [scoreDetails]
 * @property {boolean} [isFaq]
 */
/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen
 * @property {string} [title]
 * @property {string} [titleKey]
 * @property {string|ModalContent|any} [content]
 * @property {string} [contentKey]
 * @property {ModalButton[]} buttons
 * @property {any} [component]
 */

/** @type {ModalState} */
const initialState = {
  isOpen: false,
  title: '',
  content: '',
  buttons: []
};

const { subscribe, set } = writable(initialState);

export const modalState = { subscribe };

/**
 * @param {{ title?: string, titleKey?: string, content?: string|ModalContent|any, contentKey?: string, buttons?: ModalButton[] }} param0
 */
function showModal({ title, titleKey, content, contentKey, buttons }) {
  set({ isOpen: true, title, titleKey, content, contentKey, buttons: buttons || [] });
}

function closeModal() {
  set({ ...initialState });
}

export { closeModal };

export const modalStore = {
  subscribe,
  showModal,
  closeModal: () => set({ ...initialState })
}; 