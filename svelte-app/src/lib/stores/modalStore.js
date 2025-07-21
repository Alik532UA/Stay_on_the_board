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
 * @property {boolean} [closable]
 */

/** @type {ModalState} */
const initialState = {
  isOpen: false,
  title: '',
  content: '',
  buttons: [],
  component: null,
  closable: true
};

const { subscribe, set } = writable(initialState);

export const modalState = { subscribe };

/**
 * @param {{ title?: string, titleKey?: string, content?: string|ModalContent|any, contentKey?: string, buttons?: ModalButton[], component?: any, closable?: boolean }} param0
 */
function showModal({ title, titleKey, content, contentKey, buttons, component, closable = true }) {
  set({ isOpen: true, title, titleKey, content, contentKey, buttons: buttons || [], component, closable });
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