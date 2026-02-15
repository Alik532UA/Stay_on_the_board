/**
 * @file Manages the state of the game board.
 * @description Bridge pattern: writable-обгортка для Svelte 4 компонентів.
 * SSoT — boardState.svelte.ts (Runes).
 */
// src/lib/stores/boardStore.ts
import { logService } from '$lib/services/logService';
import { writable } from 'svelte/store';
import { createEmptyBoard } from '$lib/utils/boardUtils';
import type { MoveHistoryEntry } from '$lib/models/moveHistory';
import type { MoveDirectionType } from '$lib/models/Piece';
import { boardState } from './boardState.svelte';

export interface BoardState {
  boardSize: number;
  board: number[][];
  playerRow: number | null;
  playerCol: number | null;
  cellVisitCounts: Record<string, number>;
  moveHistory: MoveHistoryEntry[];
  moveQueue: Array<{ player: number; direction: MoveDirectionType; distance: number; to: { row: number; col: number } }>;
}

function createBoardStore() {
  const { subscribe, set: svelteSet } = writable<BoardState | null>(boardState.state);

  const syncStore = () => {
    svelteSet(boardState.state);
  };

  return {
    subscribe,
    set: (value: BoardState | null) => {
      boardState.state = value;
      syncStore();
    },
    update: (fn: (s: BoardState | null) => BoardState | null) => {
      boardState.update(fn);
      syncStore();
    },
    reset: () => {
      boardState.reset();
      syncStore();
    },
    movePlayer: (row: number, col: number) => {
      boardState.movePlayer(row, col);
      syncStore();
    },
    incrementVisitCount: (row: number, col: number) => {
      boardState.incrementVisitCount(row, col);
      syncStore();
    },
    resetCellVisitCounts: () => {
      boardState.resetCellVisitCounts();
      syncStore();
    },
  };
}

export const boardStore = createBoardStore();
