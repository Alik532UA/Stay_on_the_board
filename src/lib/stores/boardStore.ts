/**
 * @file Manages the state of the game board.
 * @description This store holds all data directly related to the board's state,
 * including its size, the grid itself, the player's position, and cell visit counts.
 * It is initialized as null and set up when a game starts.
 */
// src/lib/stores/boardStore.ts
import { writable } from 'svelte/store';
import { createEmptyBoard } from '$lib/utils/boardUtils';
import type { MoveHistoryEntry } from '$lib/models/moveHistory';

export interface BoardState {
  boardSize: number;
  board: number[][];
  playerRow: number | null;
  playerCol: number | null;
  cellVisitCounts: Record<string, number>;
  moveHistory: MoveHistoryEntry[];
  moveQueue: Array<{ player: number; direction: string; distance: number; to: { row: number; col: number } }>;
}

function createBoardStore() {
  const { subscribe, set, update } = writable<BoardState | null>(null);

  return {
    subscribe,
    set,
    update,
    // НАВІЩО: Інкапсулюємо логіку мутації безпосередньо тут
    movePlayer: (row: number, col: number) => {
      update(state => {
        if (!state) return null;
        const newBoard = state.board.map(r => [...r]);
        if (state.playerRow !== null && state.playerCol !== null) {
          newBoard[state.playerRow][state.playerCol] = 0;
        }
        newBoard[row][col] = 1;
        return { ...state, playerRow: row, playerCol: col, board: newBoard };
      });
    },
    incrementVisitCount: (row: number, col: number) => {
      update(state => {
        if (!state) return null;
        const key = `${row}-${col}`;
        const newCounts = { ...state.cellVisitCounts, [key]: (state.cellVisitCounts[key] || 0) + 1 };
        return { ...state, cellVisitCounts: newCounts };
      });
    },
    // Інші мутатори, специфічні для дошки...
  };
}

export const boardStore = createBoardStore();