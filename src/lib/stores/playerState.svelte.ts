// src/lib/stores/playerState.svelte.ts
// SSoT для стану гравців. Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає playerStore.ts (bridge pattern).

import type { PlayerState } from './playerStore';

class PlayerStateRune {
    private _state = $state<PlayerState | null>(null);

    get state() {
        return this._state;
    }

    set state(value: PlayerState | null) {
        this._state = value;
    }

    update(fn: (s: PlayerState | null) => PlayerState | null) {
        this._state = fn(this._state);
    }

    setCurrentPlayer(index: number) {
        if (!this._state) return;
        this._state = { ...this._state, currentPlayerIndex: index };
    }

    reset() {
        this._state = null;
    }
}

export const playerState = new PlayerStateRune();
