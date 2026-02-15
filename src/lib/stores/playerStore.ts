/**
 * @file Manages the state of the players in the game.
 * @description Bridge pattern: writable-обгортка для Svelte 4 компонентів.
 * SSoT — playerState.svelte.ts (Runes).
 */
// src/lib/stores/playerStore.ts
import { writable } from 'svelte/store';
import type { Player } from '$lib/models/player';
import { playerState } from './playerState.svelte';

export interface PlayerState {
  players: Player[];
  currentPlayerIndex: number;
}

function createPlayerStore() {
  const { subscribe, set: svelteSet } = writable<PlayerState | null>(playerState.state);

  const syncStore = () => {
    svelteSet(playerState.state);
  };

  return {
    subscribe,
    set: (value: PlayerState | null) => {
      playerState.state = value;
      syncStore();
    },
    update: (fn: (s: PlayerState | null) => PlayerState | null) => {
      playerState.update(fn);
      syncStore();
    },
    setCurrentPlayer: (index: number) => {
      playerState.setCurrentPlayer(index);
      syncStore();
    },
    // Інші мутатори для гравців...
  };
}

export const playerStore = createPlayerStore();
