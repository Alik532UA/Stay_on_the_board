import { writable } from 'svelte/store';
import type { Player } from './gameState';

export interface PlayersState {
  players: Player[];
  currentPlayerIndex: number;
}

const initialState: PlayersState = {
  players: [
    { id: 1, type: 'human', name: 'Гравець', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
    { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0, color: '#457b9d', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
  ],
  currentPlayerIndex: 0,
};

export const playersStore = writable<PlayersState>(initialState);