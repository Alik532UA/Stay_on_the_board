import { writable, get } from 'svelte/store';
import type { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { gameState, type GameState } from './gameState';
export interface Game {
  mode: BaseGameMode | null;
  state: GameState;
}

const createGameStore = () => {
  const { subscribe, update } = writable<Game>({
    mode: null,
    state: get(gameState)
  });

  gameState.subscribe(state => {
    update(game => ({ ...game, state }));
  });

  return {
    subscribe,
    setMode: (mode: BaseGameMode) => {
      update(game => ({ ...game, mode }));
    }
  };
};

export const gameStore = createGameStore();