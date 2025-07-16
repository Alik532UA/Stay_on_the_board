import { writable } from 'svelte/store';

/**
 * @typedef {Object} ModalButton
 * @property {string} [text]
 * @property {string} [textKey] // <-- ДОДАНО
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 * @property {string} [customClass]
 * @property {boolean} [isHot]
 * @property {string} [hotKey]
 */
/**
 * @typedef {Object} ModalContent
 * @property {string} [reason] - Причина завершення гри.
 * @property {number} [score] - Фінальний рахунок (для старого вигляду).
 * @property {any} [scoreDetails] - Деталізація рахунку (бонуси).
 */
/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen
 * @property {string} [title]
 * @property {string} [titleKey] // <-- ДОДАНО
 * @property {string|ModalContent} [content]
 * @property {string} [contentKey] // <-- ДОДАНО
 * @property {ModalButton[]} buttons
 */

/** @type {ModalState} */
const initialState = {
  isOpen: false,
  title: '',
  content: '',
  buttons: []
};

const { subscribe, set, update } = writable(initialState);

export const modalState = { subscribe };

/**
 * Відкриває модальне вікно
 * @param {{ title?: string, titleKey?: string, content?: string|ModalContent, contentKey?: string, buttons?: ModalButton[] }} param0
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