// src/lib/stores/testModeState.svelte.ts
// SSoT для тестового режиму. Svelte 5 Runes.

import type { TestModeState } from './testModeStore';
import { logService } from '$lib/services/logService';

const initialTestState: TestModeState = {
    isEnabled: false,
    startPositionMode: 'random',
    manualStartPosition: null,
    computerMoveMode: 'random',
    manualComputerMove: {
        direction: null,
        distance: null,
    },
};

class TestModeStateRune {
    private _state = $state<TestModeState>({ ...initialTestState });

    get state() { return this._state; }
    set state(value: TestModeState) { this._state = value; }

    update(fn: (s: TestModeState) => TestModeState) {
        this._state = fn(this._state);
    }

    toggle() {
        const isEnabled = !this._state.isEnabled;
        logService.testMode(`Test mode toggled: ${isEnabled ? 'ON' : 'OFF'}`);

        if (isEnabled) {
            this._state = {
                ...this._state,
                isEnabled: true,
                startPositionMode: 'manual',
                manualStartPosition: { x: 0, y: 0 },
                computerMoveMode: 'manual',
                manualComputerMove: { direction: 'down', distance: 1 }
            };
        } else {
            this._state = {
                ...this._state,
                isEnabled: false,
                startPositionMode: 'random',
                manualStartPosition: null,
                computerMoveMode: 'random',
                manualComputerMove: { direction: null, distance: null }
            };
        }
    }
}

export const testModeState = new TestModeStateRune();
