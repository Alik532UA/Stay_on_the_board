// src/lib/stores/columnStyleState.svelte.ts
// SSoT для стилю колонок. Svelte 5 Runes.

export type ColumnStyleMode = 'fixed' | 'flexible';

class ColumnStyleStateRune {
    private _state = $state<ColumnStyleMode>('fixed');

    get state() { return this._state; }
    set state(value: ColumnStyleMode) { this._state = value; }
}

export const columnStyleState = new ColumnStyleStateRune();
