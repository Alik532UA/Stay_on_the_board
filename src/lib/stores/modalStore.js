import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService';

/**
 * @typedef {Object} ModalButton
 * @property {string} [text]
 * @property {string} [textKey]
 * @property {boolean} [primary]
 * @property {() => void} [onClick]
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
 /**
  * @param {{ title?: string, titleKey?: string, content?: string|ModalContent|any, contentKey?: string, buttons?: ModalButton[], component?: any, props?: object, closable?: boolean, closeOnOverlayClick?: boolean, dataTestId?: string, titleDataTestId?: string }} param0
  */
 export function showModal({ title, titleKey, content, contentKey, buttons, component, props = {}, closable = true, closeOnOverlayClick = false, dataTestId, titleDataTestId }) {
  logService.ui(`[ModalStore] showModal called for '${dataTestId || titleKey}'. Pushing to stack if modal is open.`);
  update(currentState => {
    if (currentState.isOpen) {
      modalStack.push(currentState);
      logService.ui(`[ModalStore] Pushed '${currentState.dataTestId || currentState.titleKey}' to stack. Stack size: ${modalStack.length}`);
    }
    return { isOpen: true, title, titleKey, content, contentKey, buttons: buttons || [], component, props, closable, closeOnOverlayClick, dataTestId, titleDataTestId };
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

export function closeAllModals() {
  modalStack.length = 0; // Clear the stack
  set({ ...initialState });
}

export const modalStore = {
  subscribe,
  showModal,
  closeModal,
  closeAllModals
};