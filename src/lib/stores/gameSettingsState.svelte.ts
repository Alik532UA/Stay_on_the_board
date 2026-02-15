// src/lib/stores/gameSettingsState.svelte.ts
// SSoT для ігрових налаштувань. Svelte 5 Runes.
// Побічні ефекти (boardStore, availableMovesService) залишаються в bridge.

import type { GameSettingsState } from './gameSettingsTypes';
import { defaultGameSettings } from './gameSettingsDefaults';

class GameSettingsStateRune {
    private _state = $state<GameSettingsState>({ ...defaultGameSettings });

    get state() { return this._state; }
    set state(value: GameSettingsState) { this._state = value; }

    update(fn: (s: GameSettingsState) => GameSettingsState) {
        this._state = fn(this._state);
    }
}

export const gameSettingsState = new GameSettingsStateRune();
