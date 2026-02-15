// src/lib/stores/scoreState.svelte.ts
// SSoT для стану рахунку. Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає scoreStore.ts (bridge pattern).

import type { ScoreState } from './scoreStore';

export const initialScoreState: ScoreState = {
    penaltyPoints: 0,
    movesInBlockMode: 0,
    jumpedBlockedCells: 0,
    noMovesBonus: 0,
    distanceBonus: 0,
};

class ScoreStateRune {
    private _state = $state<ScoreState | null>(null);

    get state() {
        return this._state;
    }

    set state(value: ScoreState | null) {
        this._state = value;
    }

    update(fn: (s: ScoreState | null) => ScoreState | null) {
        this._state = fn(this._state);
    }

    addPenalty(points: number) {
        if (!this._state) return;
        this._state = { ...this._state, penaltyPoints: this._state.penaltyPoints + points };
    }

    reset() {
        this._state = null;
    }
}

export const scoreState = new ScoreStateRune();
