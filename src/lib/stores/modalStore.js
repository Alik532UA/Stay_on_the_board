import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService';

/**
 * @typedef {Object} ModalButton
 * @property {string} [text]
 * @property {string} [textKey]
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
 * @property {boolean} [disabled]
 * @property {string} [customClass]
 * @property {boolean} [isHot]
 * @property {string} [hotKey]
 * @property {string} [dataTestId]
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
 * @property {object} [props]
 * @property {boolean} [closable]
 * @property {boolean} [closeOnOverlayClick]
 * @property {string} [dataTestId]
 * @property {string} [titleDataTestId]
 * @property {object} [titleValues]
 */

/** @type {ModalState} */
const initialState = {
  isOpen: false,
  title: '',
  content: '',
  buttons: [],
  component: null,
  props: {},
  closable: true,
  closeOnOverlayClick: false,
  dataTestId: undefined,
  titleDataTestId: undefined
};

const store = writable(initialState);
const { subscribe, set, update } = store;

/** @type {ModalState[]} */
const modalStack = [];

export const modalState = { subscribe };

/**
 * @param {Partial<ModalState>} modalDetails
 */
export function showModal(modalDetails) {
  update(currentState => {
    // НАВІЩО: Ця перевірка запобігає "нашаруванню" однакових модалок.
    // Якщо нова модалка має той самий dataTestId (для тестів) або titleKey (якщо ID немає),
    // вона вважається ідентичною до поточної, і поточна не додається до стеку.
    // Це захист від помилок, коли showModal викликається кілька разів для однієї події.
    if (currentState.isOpen) {
      const sameIdentity =
        (modalDetails?.dataTestId && currentState.dataTestId === modalDetails.dataTestId) ||
        (!modalDetails?.dataTestId && modalDetails?.titleKey && currentState.titleKey === modalDetails.titleKey);
      if (!sameIdentity) {
        modalStack.push(currentState);
      } else {
        logService.ui(`[ModalStore] showModal: Prevented stacking identical modal '${modalDetails.dataTestId || modalDetails.titleKey}'.`);
      }
    }
    const newState = {
      ...initialState,
      ...modalDetails,
      isOpen: true,
    };
    logService.ui(`[ModalStore] showModal called. New modal: '${newState.dataTestId || newState.titleKey}'. Stack size: ${modalStack.length}`);
    return newState;
  });
}

/**
 * @param {Partial<ModalState>} modalDetails
 */
export function showModalAsReplacement(modalDetails) {
  logService.ui(`[ModalStore] showModalAsReplacement called. Clearing stack and showing new modal: '${modalDetails.dataTestId || modalDetails.titleKey}'.`);
  modalStack.length = 0; // Очищуємо стек
  set({
    ...initialState,
    ...modalDetails,
    isOpen: true,
  });
}

export function closeModal() {
  logService.ui(`[ModalStore] closeModal called. Stack size: ${modalStack.length}`);
  if (modalStack.length > 0) {
    const previousState = modalStack.pop();
    if (previousState) {
      logService.ui(`[ModalStore] Popped '${previousState.dataTestId || previousState.titleKey}' from stack. Restoring previous state.`);
      set(previousState);
    }
  } else {
    logService.ui('[ModalStore] Stack is empty. Resetting to initial state.');
    set({ ...initialState });
  }
}

export const modalStore = {
  subscribe,
  closeModal,
  showModal,
  showModalAsReplacement
};