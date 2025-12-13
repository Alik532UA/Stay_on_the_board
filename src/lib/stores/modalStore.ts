// src/lib/stores/modalStore.ts
/**
 * @file Store для керування модальними вікнами.
 * @description Підтримує стек модальних вікон для правильного закриття.
 */

import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService';

/**
 * Тип варіанту відображення модального вікна.
 * - standard: Класичне вікно з рамкою, фоном та хедером.
 * - menu: Прозоре вікно на весь екран, контент центрується, хедер прихований, додається кнопка "Назад".
 */
export type ModalVariant = 'standard' | 'menu';

/**
 * Кнопка модального вікна.
 */
export interface ModalButton {
    text?: string;
    textKey?: string;
    primary?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    customClass?: string;
    isHot?: boolean;
    hotKey?: string;
    dataTestId?: string;
}

/**
 * Контент модального вікна.
 */
export interface ModalContent {
    reason?: string;
    score?: number;
    reasonKey?: string;
    scoreDetails?: unknown;
    isFaq?: boolean;
}

/**
 * Стан модального вікна.
 */
export interface ModalState {
    isOpen: boolean;
    title?: string;
    titleKey?: string;
    content?: string | ModalContent | unknown;
    contentKey?: string;
    buttons: ModalButton[];
    component?: unknown;
    props?: Record<string, unknown>;
    closable?: boolean;
    closeOnOverlayClick?: boolean;
    dataTestId?: string;
    customClass?: string;
    titleValues?: Record<string, unknown>;
    variant: ModalVariant; // Нове поле
}

const initialState: ModalState = {
    isOpen: false,
    title: '',
    content: '',
    buttons: [],
    component: null,
    props: {},
    closable: true,
    closeOnOverlayClick: false,
    dataTestId: undefined,
    customClass: undefined,
    variant: 'standard' // Значення за замовчуванням
};

const store = writable<ModalState>(initialState);
const { subscribe, set, update } = store;

const modalStack: ModalState[] = [];

export const modalState = { subscribe };

/**
 * Показує модальне вікно.
 */
export function showModal({ dataTestId, variant = 'standard', ...modalDetails }: Partial<ModalState> & { dataTestId: string }): void {
    update(currentState => {
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
        const newState: ModalState = {
            ...initialState,
            ...modalDetails,
            dataTestId,
            variant, // Зберігаємо варіант
            isOpen: true,
        };
        logService.modal(`[ModalStore] showModal called. New modal: '${newState.dataTestId || newState.titleKey}' (${newState.variant}). Stack size: ${modalStack.length}`, { newState, stack: [...modalStack] });
        return newState;
    });
}

/**
 * Показує модальне вікно, замінюючи поточне (без стеку).
 */
export function showModalAsReplacement(modalDetails: Partial<ModalState>): void {
    logService.modal(`[ModalStore] showModalAsReplacement called. Clearing stack and showing new modal: '${modalDetails.dataTestId || modalDetails.titleKey}'.`, { modalDetails });
    modalStack.length = 0;
    const newState: ModalState = {
        ...initialState,
        ...modalDetails,
        isOpen: true,
    };
    set(newState);
}

/**
 * Закриває поточне модальне вікно.
 */
export function closeModal(): void {
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

/**
 * Закриває всі модальні вікна.
 */
export function closeAllModals(): void {
    logService.modal(`[ModalStore] closeAllModals called. Clearing stack of size ${modalStack.length}.`);
    modalStack.length = 0;
    set({ ...initialState });
}

export const modalStore = {
    subscribe,
    update,
    closeModal,
    showModal,
    showModalAsReplacement,
    closeAllModals
};