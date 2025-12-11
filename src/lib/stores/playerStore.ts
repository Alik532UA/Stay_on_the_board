/**
 * @file Manages the state of the players in the game.
 * @description This store holds information about the players, such as their data (name, color)
 * and who the current player is. It is initialized as null and set up when a game starts.
 */
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
