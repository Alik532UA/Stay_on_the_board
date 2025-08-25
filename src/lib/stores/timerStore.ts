import { writable } from 'svelte/store';

export interface TimerState {
  remainingTime: number | null;
  turnTimeLeft: number | null;
}

const initialState: TimerState = {
  remainingTime: null,
  turnTimeLeft: null,
};

function createTimerStore() {
  const { subscribe, set, update } = writable<TimerState>(initialState);

  return {
    subscribe,
    set,
    update,
    setRemainingTime: (time: number) => update(state => ({ ...state, remainingTime: time })),
    setTurnTimeLeft: (time: number) => update(state => ({ ...state, turnTimeLeft: time })),
    reset: () => set(initialState),
  };
}

export const timerStore = createTimerStore();