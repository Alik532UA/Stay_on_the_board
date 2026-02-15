// src/lib/stores/gameStore.ts
// Bridge pattern: writable-обгортка для Svelte 4 компонентів.
// SSoT — gameState.rune.svelte.ts (Runes).

import { writable } from 'svelte/store';
import type { BaseGameMode } from '$lib/gameModes/BaseGameMode';
import { gameStateRune } from './gameState.rune.svelte';

const createGameStore = () => {
  const { subscribe, set: svelteSet } = writable<{ mode: BaseGameMode | null }>(gameStateRune.state);

  const syncStore = () => {
    svelteSet(gameStateRune.state);
  };

  return {
    subscribe,
    setMode: (mode: BaseGameMode) => {
      gameStateRune.setMode(mode);
      syncStore();
    },
    reset: () => {
      gameStateRune.reset();
      syncStore();
    },
  };
};

export const gameStore = createGameStore();
