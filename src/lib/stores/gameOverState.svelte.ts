// src/lib/stores/gameOverState.svelte.ts
// SSoT для стану завершення гри. Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає gameOverStore.ts (bridge pattern).

import type { GameOverStoreState, GameOverPayload } from './gameOverStore';

const initialGameOverState: GameOverStoreState = {
    isGameOver: false,
    gameResult: null,
};

class GameOverStateRune {
    private _state = $state<GameOverStoreState>({ ...initialGameOverState });

    get state() {
        return this._state;
    }

    set state(value: GameOverStoreState) {
        this._state = value;
    }

    update(fn: (s: GameOverStoreState) => GameOverStoreState) {
        this._state = fn(this._state);
    }

    setGameOver(result: GameOverPayload) {
        this._state = { ...this._state, isGameOver: true, gameResult: result };
    }

    resetGameOverState() {
        this._state = { ...initialGameOverState };
    }

    clearGameOverState() {
        this._state = { ...initialGameOverState };
    }

    restoreState(newState: GameOverStoreState) {
        this._state = newState;
    }
}

export const gameOverState = new GameOverStateRune();
