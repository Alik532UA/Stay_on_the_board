// src/lib/stores/modalState.svelte.ts
// SSoT для модальних вікон. Svelte 5 Runes.
// Стек модалок та бізнес-логіка залишаються в bridge.

import type { ModalState, ModalVariant, ModalButton, ModalContent } from './modalStore';

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
    variant: 'standard'
};

class ModalStateRune {
    private _state = $state<ModalState>({ ...initialState });

    get state() { return this._state; }
    set state(value: ModalState) { this._state = value; }

    update(fn: (s: ModalState) => ModalState) {
        this._state = fn(this._state);
    }

    reset() {
        this._state = { ...initialState };
    }
}

export const modalStateRune = new ModalStateRune();
export { initialState as modalInitialState };
