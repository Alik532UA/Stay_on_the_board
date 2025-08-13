import { writable } from 'svelte/store';
import { createEmptyBoard, getRandomCell } from '$lib/utils/boardUtils';
import type { CellVisitCounts, MoveHistoryEntry } from './gameState';

export interface BoardState {
  boardSize: number;
  board: number[][];
  playerRow: number | null;
  playerCol: number | null;
  cellVisitCounts: CellVisitCounts;
  moveHistory: MoveHistoryEntry[];
}

const initialBoardSize = 4;
const { row: initialRow, col: initialCol } = getRandomCell(initialBoardSize);
const board = createEmptyBoard(initialBoardSize);
board[initialRow][initialCol] = 1;

const initialState: BoardState = {
  boardSize: initialBoardSize,
  board,
  playerRow: initialRow,
  playerCol: initialCol,
  cellVisitCounts: {},
  moveHistory: [{ pos: { row: initialRow, col: initialCol }, blocked: [], visits: {}, blockModeEnabled: false }],
};

export const boardStore = writable<BoardState>(initialState);