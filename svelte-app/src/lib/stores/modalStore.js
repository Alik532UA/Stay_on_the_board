import { writable } from 'svelte/store';

/**
 * @typedef {Object} ModalButton
 * @property {string} text
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 */
/**
 * @typedef {Object} ModalContent
 * @property {string} reason - Причина завершення гри.
 * @property {number} [score] - Фінальний рахунок.
 * @property {object} [scoreDetails] - Деталізація рахунку (бонуси).
 */
/**
 * @typedef {Object} ModalState
 * @property {boolean} isOpen
 * @property {string} title
 * @property {ModalContent | string} content - Може бути об'єктом або рядком для сумісності.
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
 * @param {{ title: string, content: ModalContent | string, buttons?: ModalButton[] }} param0
 */
function showModal({ title, content, buttons = [] }) {
  set({ isOpen: true, title, content, buttons });
}

function closeModal() {
  set({ ...initialState });
}

export { closeModal };

export const modalStore = {
  subscribe,
  showModal,
  closeModal
}; 