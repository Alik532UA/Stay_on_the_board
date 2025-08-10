import { writable, get } from 'svelte/store';
import type { IGameMode } from '$lib/gameModes/gameMode.interface';
import { gameState, type GameState } from './gameState';
import { localGameStore, type LocalGameState } from './localGameStore';

export interface Game {
  mode: IGameMode | null;
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
    setMode: (mode: IGameMode) => {
      update(game => ({ ...game, mode }));
    }
  };
};

export const gameStore = createGameStore();