// file: src/lib/stores/gameState.ts
import { writable } from 'svelte/store';
import { createEmptyBoard, getRandomCell } from '$lib/utils/boardUtils.ts';
import type { Move } from '$lib/utils/gameUtils';
import { get } from 'svelte/store';
import { testModeStore } from './testModeStore';

const initialBoardSize = 4;

import type { Player } from '$lib/models/player';
import type { MoveHistoryEntry } from '$lib/models/moveHistory';

export interface GameState {
  gameId: number;
  boardSize: number;
  board: number[][];
  playerRow: number|null;
  playerCol: number|null;
  availableMoves: Move[];
  players: Player[];
  currentPlayerIndex: number;
  isGameOver: boolean;
  penaltyPoints: number;
  movesInBlockMode: number;
  jumpedBlockedCells: number;
  finishedByFinishButton: boolean;
  cellVisitCounts: any;
  moveHistory: MoveHistoryEntry[];
  moveQueue: Array<{player: number, direction: string, distance: number}>;
  selectedDirection: string | null;
  selectedDistance: number | null;
  lastMove: { direction: string, distance: number, player: number } | null;
  gameOverReasonKey: string | null;
  gameOverReasonValues: Record<string, any> | null;
  baseScore?: number;
  sizeBonus?: number;
  blockModeBonus?: number;
  jumpBonus?: number;
  finishBonus?: number;
  noMovesBonus?: number;
  distanceBonus?: number;
  totalPenalty?: number;
  totalScore?: number;
  noMovesClaimsCount: number;
  noMovesClaimed: boolean;
  isNewGame: boolean;
  isResumedGame: boolean;
  scoresAtRoundStart: number[];
  isComputerMoveInProgress: boolean;
  isFirstMove: boolean;
}

export function createInitialState(config: any = {}): GameState {
  const size = config.size ?? initialBoardSize;
  const players = config.players ?? [
    { id: 1, type: 'human', name: 'Гравець', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
    { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0, color: '#457b9d', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
  ];
  
  const testModeActive = config.testMode ?? false;
  const testModeState = get(testModeStore);
  const { row: initialRow, col: initialCol } =
    testModeActive && testModeState.startPositionMode === 'manual' && testModeState.manualStartPosition
    ? { row: testModeState.manualStartPosition.y, col: testModeState.manualStartPosition.x }
    : testModeActive && testModeState.startPositionMode === 'predictable'
    ? { row: 0, col: 0 }
    : getRandomCell(size);
  const board = createEmptyBoard(size);
  board[initialRow][initialCol] = 1;
  
  return {
    gameId: Date.now(),
    boardSize: size,
    board,
    playerRow: initialRow,
    playerCol: initialCol,
    availableMoves: [],
    players,
    currentPlayerIndex: 0,
    isGameOver: false,
    penaltyPoints: 0,
    movesInBlockMode: 0,
    jumpedBlockedCells: 0,
    finishedByFinishButton: false,
    cellVisitCounts: {},
    moveHistory: [{ pos: { row: initialRow, col: initialCol }, blocked: [], visits: {}, blockModeEnabled: false }],
    gameOverReasonKey: null,
    gameOverReasonValues: null,
    moveQueue: [],
    selectedDirection: null,
    selectedDistance: null,
    lastMove: null,
    noMovesClaimsCount: 0,
    noMovesClaimed: false,
    noMovesBonus: 0,
    distanceBonus: 0,
    isNewGame: true,
    isResumedGame: false,
    scoresAtRoundStart: players.map((p: any) => p.score),
    isComputerMoveInProgress: false,
    isFirstMove: true,
  };
}

function createGameStateStore() {
  const { subscribe, update, set } = writable<GameState | null>(null);

  return {
    subscribe,
    set,
    update,
  };
}

export const gameState = createGameStateStore();