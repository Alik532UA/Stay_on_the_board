// src/lib/stores/animationState.svelte.ts
// SSoT для стану анімацій. Використовує Svelte 5 Runes.
// Обгортку для Svelte 4 (writable) надає animationStore.ts (bridge pattern).
//
// ВАЖЛИВО: Анімації — це ВИКЛЮЧНО візуальний шар.
// Вони НЕ впливають на ігрову логіку та center-info.

import { logService } from '../services/logService';
import type { AnimationState, AnimationMove } from './animationStore';

const initialAnimationState: AnimationState = {
    isAnimating: false,
    gameId: Date.now(),
    currentAnimation: null,
    visualMoveQueue: [],
    animationQueue: [],
    isPlayingAnimation: false,
    isComputerMoveCompleted: true,
};

class AnimationStateRune {
    private _state = $state<AnimationState>({ ...initialAnimationState });

    get state() {
        return this._state;
    }

    set state(value: AnimationState) {
        this._state = value;
    }

    update(fn: (s: AnimationState) => AnimationState) {
        this._state = fn(this._state);
    }

    reset() {
        logService.animation('AnimationState: reset()');
        this._state = { ...initialAnimationState, gameId: Date.now() };
    }

    getInitialState(): AnimationState {
        return { ...initialAnimationState };
    }
}

export const animationState = new AnimationStateRune();
