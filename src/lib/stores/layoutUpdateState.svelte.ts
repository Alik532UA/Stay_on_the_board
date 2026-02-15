// src/lib/stores/layoutUpdateState.svelte.ts
// SSoT для тригеру оновлення лейауту. Svelte 5 Runes.

class LayoutUpdateStateRune {
    private _state = $state<number>(0);

    get state() { return this._state; }
    set state(value: number) { this._state = value; }
    trigger() { this._state++; }
}

export const layoutUpdateState = new LayoutUpdateStateRune();
