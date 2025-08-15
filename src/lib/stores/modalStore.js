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
 * @property {string} [reasonKey]
 * @property {unknown} [scoreDetails]
 * @property {boolean} [isFaq]
 */
/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen
 * @property {string} [title]
 * @property {string} [titleKey]
 * @property {string|ModalContent|unknown} [content]
 * @property {string} [contentKey]
 * @property {ModalButton[]} buttons
 * @property {unknown} [component]
 * @property {boolean} [closable]
 * @property {string} [dataTestId]
 * @property {string} [titleDataTestId]
 */

/** @type {ModalState} */
const initialState = {
  isOpen: false,
  title: '',
  content: '',
  buttons: [],
  component: null,
  closable: true,
  dataTestId: undefined,
  titleDataTestId: undefined
};

const { subscribe, set } = writable(initialState);

export const modalState = { subscribe };

/**
 * @param {{ title?: string, titleKey?: string, content?: string|ModalContent|any, contentKey?: string, buttons?: ModalButton[], component?: any, closable?: boolean, dataTestId?: string, titleDataTestId?: string }} param0
 */
export function showModal({ title, titleKey, content, contentKey, buttons, component, closable = true, dataTestId, titleDataTestId }) {
  set({ isOpen: true, title, titleKey, content, contentKey, buttons: buttons || [], component, closable, dataTestId, titleDataTestId });
}

export function closeModal() {
  set({ ...initialState });
}

export const modalStore = {
  subscribe,
  showModal,
  closeModal
};