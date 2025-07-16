import { writable } from 'svelte/store';

/**
 * @typedef {Object} ModalButton
 * @property {string} text
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 * @property {string} [customClass] // Додаю для стилізації кнопок
 * @property {boolean} [isHot] // Додаю для фокусу
 * @property {string} [hotKey] // <-- ДОДАНО
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
 * @property {string} title
 * @property {string|ModalContent} content - Може бути об'єктом або рядком для сумісності.
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
 * @param {{ title: string, content: string|ModalContent, buttons?: ModalButton[] }} param0
 */
function showModal({ title, content, buttons }) {
  set({ isOpen: true, title, content, buttons: buttons || [] });
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