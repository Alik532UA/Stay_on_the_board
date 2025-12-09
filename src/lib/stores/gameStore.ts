// src/lib/stores/gameStore.ts
import { writable } from 'svelte/store';
import type { BaseGameMode } from '$lib/gameModes/BaseGameMode';

const createGameStore = () => {
  const { subscribe, update } = writable<{ mode: BaseGameMode | null }>({
    mode: null,
  });

  return {
    subscribe,
    setMode: (mode: BaseGameMode) => {
      update(game => ({ ...game, mode }));
    },
    reset: () => update(() => ({ mode: null })),
  };
};

export const gameStore = createGameStore();
