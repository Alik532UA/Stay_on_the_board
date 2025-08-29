// src/lib/stores/playerStore.ts
import { writable } from 'svelte/store';
import type { Player } from '$lib/models/player';

export interface PlayerState {
  players: Player[];
  currentPlayerIndex: number;
}

function createPlayerStore() {
  const { subscribe, set, update } = writable<PlayerState | null>(null);

  return {
    subscribe,
    set,
    update,
    setCurrentPlayer: (index: number) => {
      update(state => {
        if (!state) return null;
        return { ...state, currentPlayerIndex: index };
      });
    },
    // Інші мутатори для гравців...
  };
}

export const playerStore = createPlayerStore();