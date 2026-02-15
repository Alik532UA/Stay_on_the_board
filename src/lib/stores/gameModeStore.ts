// src/lib/stores/gameModeStore.ts
// Bridge pattern: writable-обгортка для Svelte 4 компонентів.
// SSoT — gameModeState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { gameModeState } from './gameModeState.svelte';

export interface GameModeState {
  activeMode: string | null;
}

export const initialState: GameModeState = {
  activeMode: null,
};

function createGameModeStore() {
  const { subscribe, set: svelteSet } = writable<GameModeState>(gameModeState.state);

  const syncStore = () => {
    svelteSet(gameModeState.state);
  };

  return {
    subscribe,
    set: (value: GameModeState) => {
      gameModeState.state = value;
      syncStore();
    },
    update: (fn: (s: GameModeState) => GameModeState) => {
      gameModeState.update(fn);
      syncStore();
    },
    setActiveMode: (mode: string) => {
      gameModeState.setActiveMode(mode);
      syncStore();
    },
    reset: () => {
      gameModeState.reset();
      syncStore();
    },
  };
}

export const gameModeStore = createGameModeStore();
