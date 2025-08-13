import { writable, get } from 'svelte/store';
import type { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { gameState, type GameState } from './gameState';
import { localGameStore, type LocalGameState } from './localGameStore';

export interface Game {
  mode: BaseGameMode | null;
  state: GameState;
  localState?: LocalGameState;
}

const createGameStore = () => {
  const { subscribe, update } = writable<Game>({
    mode: null,
    state: get(gameState),
    localState: get(localGameStore)
  });

  gameState.subscribe(state => {
    update(game => ({ ...game, state }));
  });

  localGameStore.subscribe(localState => {
    update(game => ({ ...game, localState }));
  });

  return {
    subscribe,
    setMode: (mode: BaseGameMode) => {
      update(game => ({ ...game, mode }));
    }
  };
};

export const gameStore = createGameStore();