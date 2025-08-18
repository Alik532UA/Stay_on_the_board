import { writable, get } from 'svelte/store';
import type { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { gameState, type GameState } from './gameState';

const createGameStore = () => {
  const { subscribe, update } = writable<any>({
    mode: null,
    state: get(gameState)
  });

  gameState.subscribe(newState => {
    update(game => ({ ...game, state: newState }));
  });

  return {
    subscribe,
    setMode: (mode: BaseGameMode) => {
      update(game => ({ ...game, mode }));
    }
  };
};

export const gameStore = createGameStore();