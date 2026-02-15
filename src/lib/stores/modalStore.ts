// src/lib/stores/modalStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — modalState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { logService } from '$lib/services/logService';
import { modalStateRune, modalInitialState } from './modalState.svelte';

/**
 * Тип варіанту відображення модального вікна.
 */
export type ModalVariant = 'standard' | 'menu';

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

export interface ModalContent {
    reason?: string;
    score?: number;
    reasonKey?: string;
    scoreDetails?: unknown;
    isFaq?: boolean;
}

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
    variant: ModalVariant;
}

const { subscribe, set: svelteSet } = writable<ModalState>(modalStateRune.state);

const syncStore = () => { svelteSet(modalStateRune.state); };

// Стек модалок — залишається як побічний ефект bridge
const modalStack: ModalState[] = [];

export const modalState = { subscribe };

export function showModal({ dataTestId, variant = 'standard', ...modalDetails }: Partial<ModalState> & { dataTestId: string }): void {
    modalStateRune.update(currentState => {
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
            ...modalInitialState,
            ...modalDetails,
            dataTestId,
            variant,
            isOpen: true,
        };
        logService.modal(`[ModalStore] showModal called. New modal: '${newState.dataTestId || newState.titleKey}' (${newState.variant}). Stack size: ${modalStack.length}`, { newState, stack: [...modalStack] });
        return newState;
    });
    syncStore();
}

export function showModalAsReplacement(modalDetails: Partial<ModalState>): void {
    logService.modal(`[ModalStore] showModalAsReplacement called. Clearing stack and showing new modal: '${modalDetails.dataTestId || modalDetails.titleKey}'.`, { modalDetails });
    modalStack.length = 0;
    const newState: ModalState = {
        ...modalInitialState,
        ...modalDetails,
        isOpen: true,
    };
    modalStateRune.state = newState;
    syncStore();
}

export function closeModal(): void {
    logService.modal(`[ModalStore] closeModal called. Stack size before action: ${modalStack.length}`, { stack: [...modalStack] });
    if (modalStack.length > 0) {
        const previousState = modalStack.pop();
        if (previousState) {
            logService.modal(`[ModalStore] Popped '${previousState.dataTestId || previousState.titleKey}' from stack. Restoring previous state.`, { previousState });
            modalStateRune.state = previousState;
        }
    } else {
        logService.modal('[ModalStore] Stack is empty. Resetting to initial state.', { initialState: modalInitialState });
        modalStateRune.reset();
    }
    syncStore();
}

export function closeAllModals(): void {
    logService.modal(`[ModalStore] closeAllModals called. Clearing stack of size ${modalStack.length}.`);
    modalStack.length = 0;
    modalStateRune.reset();
    syncStore();
}

export const modalStore = {
    subscribe,
    update: (fn: (s: ModalState) => ModalState) => {
        modalStateRune.update(fn);
        syncStore();
    },
    closeModal,
    showModal,
    showModalAsReplacement,
    closeAllModals
};