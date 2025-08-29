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
  dataTestId: undefined
};

const store = writable(initialState);
const { subscribe, set, update } = store;

/** @type {ModalState[]} */
const modalStack = [];

export const modalState = { subscribe };

/**
 * @param {Partial<ModalState> & { dataTestId: string }} modalDetails
 */
export function showModal({ dataTestId, ...modalDetails }) {
  update(currentState => {
    // НАВІЩО: Ця перевірка запобігає "нашаруванню" однакових модалок.
    // Якщо нова модалка має той самий dataTestId (для тестів) або titleKey (якщо ID немає),
    // вона вважається ідентичною до поточної, і поточна не додається до стеку.
    // Це захист від помилок, коли showModal викликається кілька разів для однієї події.
    if (currentState.isOpen) {
      const sameIdentity =
        (dataTestId && currentState.dataTestId === dataTestId) ||
        (!dataTestId && modalDetails?.titleKey && currentState.titleKey === modalDetails.titleKey);
      if (!sameIdentity) {
        modalStack.push(currentState);
      } else {
        logService.modal(`[ModalStore] showModal: Prevented stacking identical modal '${dataTestId || modalDetails.titleKey}'.`);
      }
    }
    const newState = {
      ...initialState,
      ...modalDetails,
      dataTestId,
      isOpen: true,
    };
    logService.modal(`[ModalStore] showModal called. New modal: '${newState.dataTestId || newState.titleKey}'. Stack size: ${modalStack.length}`, { newState, stack: [...modalStack] });
    return newState;
  });
}

/**
 * @param {Partial<ModalState>} modalDetails
 */
export function showModalAsReplacement(modalDetails) {
  logService.modal(`[ModalStore] showModalAsReplacement called. Clearing stack and showing new modal: '${modalDetails.dataTestId || modalDetails.titleKey}'.`, { modalDetails });
  modalStack.length = 0; // Очищуємо стек
  const newState = {
    ...initialState,
    ...modalDetails,
    isOpen: true,
  };
  set(newState);
}

export function closeModal() {
  logService.modal(`[ModalStore] closeModal called. Stack size before action: ${modalStack.length}`, { stack: [...modalStack] });
  if (modalStack.length > 0) {
    const previousState = modalStack.pop();
    if (previousState) {
      logService.modal(`[ModalStore] Popped '${previousState.dataTestId || previousState.titleKey}' from stack. Restoring previous state.`, { previousState });
      set(previousState);
    }
  } else {
    logService.modal('[ModalStore] Stack is empty. Resetting to initial state.', { initialState });
    set({ ...initialState });
  }
}

export const modalStore = {
  subscribe,
  closeModal,
  showModal,
  showModalAsReplacement
};