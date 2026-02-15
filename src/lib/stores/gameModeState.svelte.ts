// src/lib/stores/gameModeState.svelte.ts
// SSoT для стану ігрового режиму. Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає gameModeStore.ts (bridge pattern).

import type { GameModeState } from './gameModeStore';

const initialGameModeState: GameModeState = {
    activeMode: null,
};

class GameModeStateRune {
    private _state = $state<GameModeState>({ ...initialGameModeState });

    get state() {
        return this._state;
    }

    set state(value: GameModeState) {
        this._state = value;
    }

    update(fn: (s: GameModeState) => GameModeState) {
        this._state = fn(this._state);
    }

    setActiveMode(mode: string) {
        this._state = { ...this._state, activeMode: mode };
    }

    reset() {
        this._state = { ...initialGameModeState };
    }
}

export const gameModeState = new GameModeStateRune();
