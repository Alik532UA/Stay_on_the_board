import { initialUIState, type UiState } from '$lib/types/uiState';

class UiStateRune {
    private _state = $state<UiState>(initialUIState);

    get state() {
        return this._state;
    }

    set state(value: UiState) {
        this._state = value;
    }

    // Допоміжні методи для зручності
    update(fn: (s: UiState) => UiState) {
        this._state = fn(this._state);
    }

    reset() {
        this._state = { ...initialUIState };
    }
}

export const uiState = new UiStateRune();
