// src/lib/stores/uiGeneralState.svelte.ts
// SSoT для загального UI стану. Svelte 5 Runes.

export interface UiStoreState {
    shouldShowGameModeModalOnLoad: boolean;
}

class UiGeneralStateRune {
    private _state = $state<UiStoreState>({ shouldShowGameModeModalOnLoad: false });

    get state() { return this._state; }
    set state(value: UiStoreState) { this._state = value; }

    update(fn: (s: UiStoreState) => UiStoreState) {
        this._state = fn(this._state);
    }

    requestGameModeModal() {
        this._state = { ...this._state, shouldShowGameModeModalOnLoad: true };
    }
}

export const uiGeneralState = new UiGeneralStateRune();
