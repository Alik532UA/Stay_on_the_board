// src/lib/stores/availableMovesState.svelte.ts
// SSoT для доступних ходів. Svelte 5 Runes.

import type { Move } from '$lib/utils/gameUtils';

class AvailableMovesStateRune {
    private _state = $state<Move[]>([]);

    get state() { return this._state; }
    set state(value: Move[]) { this._state = value; }
    reset() { this._state = []; }
}

export const availableMovesState = new AvailableMovesStateRune();
