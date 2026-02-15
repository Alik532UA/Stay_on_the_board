// src/lib/stores/gameState.rune.svelte.ts
// SSoT для стану гри (зберігає активний GameMode). Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає gameStore.ts (bridge pattern).

import type { BaseGameMode } from '$lib/gameModes/BaseGameMode';

interface GameStoreState {
    mode: BaseGameMode | null;
}

class GameStateRune {
    private _state = $state<GameStoreState>({ mode: null });

    get state() {
        return this._state;
    }

    set state(value: GameStoreState) {
        this._state = value;
    }

    setMode(mode: BaseGameMode) {
        this._state = { ...this._state, mode };
    }

    reset() {
        this._state = { mode: null };
    }
}

export const gameStateRune = new GameStateRune();
