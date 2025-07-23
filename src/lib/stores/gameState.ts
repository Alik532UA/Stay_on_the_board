/**
 * @file Manages the core, persistent state of the game board and logic.
 * This is the single source of truth for the game's current situation.
 */
import { writable } from 'svelte/store';
import * as core from '$lib/gameCore';

const initialBoardSize = 4;
const { row: initialRow, col: initialCol } = core.getRandomCell(initialBoardSize);

export type PlayerType = 'human' | 'ai' | 'remote';
export interface Player { id: number; type: PlayerType; name: string; }
export type CellVisitCounts = Record<string, number>;
export interface MoveHistoryEntry { pos: {row: number, col: number}, blocked: {row: number, col: number}[], visits?: CellVisitCounts }
export interface GameState {
  gameId: number;
  boardSize: number;
  board: number[][];
  playerRow: number|null;
  playerCol: number|null;
  availableMoves: core.Move[];
  players: Player[];
  currentPlayerIndex: number;
  isGameOver: boolean;
  score: number;
  penaltyPoints: number;
  movesInBlockMode: number;
  jumpedBlockedCells: number;
  finishedByFinishButton: boolean;
  cellVisitCounts: CellVisitCounts;
  moveHistory: MoveHistoryEntry[];
  moveQueue: Array<{player: number, direction: string, distance: number}>;
  gameOverReasonKey: string | null;
  gameOverReasonValues: Record<string, any> | null;
  // Додаю фінальні поля для відображення рахунку
  baseScore?: number;
  sizeBonus?: number;
  blockModeBonus?: number;
  jumpBonus?: number;
  finishBonus?: number;
  noMovesBonus?: number;
  totalPenalty?: number;
  totalScore?: number;
  noMovesClaimsCount: number;
}

export function createInitialState(): GameState {
  const board = core.createEmptyBoard(initialBoardSize);
  board[initialRow][initialCol] = 1;
  return {
    gameId: Date.now(),
    boardSize: initialBoardSize,
    board,
    playerRow: initialRow,
    playerCol: initialCol,
    availableMoves: core.getAvailableMoves(initialRow, initialCol, initialBoardSize, {}, 0),
    players: [
      { id: 1, type: 'human', name: 'Гравець' },
      { id: 2, type: 'ai', name: 'Комп\'ютер' }
    ],
    currentPlayerIndex: 0,
    isGameOver: false,
    score: 0,
    penaltyPoints: 0,
    movesInBlockMode: 0,
    jumpedBlockedCells: 0,
    finishedByFinishButton: false,
    cellVisitCounts: {},
    moveHistory: [{ pos: { row: initialRow, col: initialCol }, blocked: [], visits: {} }],
    gameOverReasonKey: null,
    gameOverReasonValues: null,
    moveQueue: [],
    noMovesClaimsCount: 0,
  };
}

export const gameState = writable<GameState>(createInitialState()); 