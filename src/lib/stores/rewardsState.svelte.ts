// src/lib/stores/rewardsState.svelte.ts
// SSoT для нагород. Svelte 5 Runes.
// Firebase та localStorage залишаються в bridge-шарі.

import type { RewardsState, UnlockedReward } from '$lib/types/rewards';

const defaultState: RewardsState = {
    unlockedRewards: {},
    hasUnseenRewards: false
};

class RewardsStateRune {
    private _state = $state<RewardsState>({ ...defaultState });

    get state() { return this._state; }
    set state(value: RewardsState) { this._state = value; }

    update(fn: (s: RewardsState) => RewardsState) {
        this._state = fn(this._state);
    }

    reset() {
        this._state = { ...defaultState };
    }
}

export const rewardsState = new RewardsStateRune();
