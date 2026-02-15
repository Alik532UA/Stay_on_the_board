// src/lib/stores/timerState.svelte.ts
// SSoT для стану таймера. Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає timerStore.ts (bridge pattern).

import type { TimerState } from './timerStore';

const initialTimerState: TimerState = {
    remainingTime: null,
    turnTimeLeft: null,
};

class TimerStateRune {
    private _state = $state<TimerState>(initialTimerState);

    get state() {
        return this._state;
    }

    set state(value: TimerState) {
        this._state = value;
    }

    update(fn: (s: TimerState) => TimerState) {
        this._state = fn(this._state);
    }

    setRemainingTime(time: number) {
        this._state = { ...this._state, remainingTime: time };
    }

    setTurnTimeLeft(time: number) {
        this._state = { ...this._state, turnTimeLeft: time };
    }

    reset() {
        this._state = { ...initialTimerState };
    }
}

export const timerState = new TimerStateRune();
