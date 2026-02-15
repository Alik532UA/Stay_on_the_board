// src/lib/stores/timerStore.ts
// Bridge pattern: writable-обгортка для Svelte 4 компонентів.
// SSoT — timerState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { timerState } from './timerState.svelte';

export interface TimerState {
  remainingTime: number | null;
  turnTimeLeft: number | null;
}

function createTimerStore() {
  const { subscribe, set: svelteSet } = writable<TimerState>(timerState.state);

  // Синхронізація writable з Rune SSoT
  const syncStore = () => {
    svelteSet(timerState.state);
  };

  return {
    subscribe,
    set: (value: TimerState) => {
      timerState.state = value;
      syncStore();
    },
    update: (fn: (s: TimerState) => TimerState) => {
      timerState.update(fn);
      syncStore();
    },
    setRemainingTime: (time: number) => {
      timerState.setRemainingTime(time);
      syncStore();
    },
    setTurnTimeLeft: (time: number) => {
      timerState.setTurnTimeLeft(time);
      syncStore();
    },
    reset: () => {
      timerState.reset();
      syncStore();
    },
  };
}

export const timerStore = createTimerStore();
