import { writable } from 'svelte/store';

export interface GameModeState {
  activeMode: string | null;
  // Add any mode-specific state properties here in the future
}

const initialState: GameModeState = {
  activeMode: null,
};

function createGameModeStore() {
  const { subscribe, set, update } = writable<GameModeState>(initialState);

  return {
    subscribe,
    set,
    update,
    setActiveMode: (mode: string) => update(state => ({ ...state, activeMode: mode })),
    reset: () => set(initialState),
  };
}

export const gameModeStore = createGameModeStore();