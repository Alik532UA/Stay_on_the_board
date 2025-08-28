// src/lib/stores/gameState.ts
import { writable } from 'svelte/store';
import { createEmptyBoard } from '$lib/utils/boardUtils.ts';
import { getRandomCell, getInitialPosition } from '$lib/utils/initialPositionUtils';
import type { Move } from '$lib/utils/gameUtils';
import { get } from 'svelte/store';
import { testModeStore } from './testModeStore';
import type { Player } from '$lib/models/player';
import type { MoveHistoryEntry } from '$lib/models/moveHistory';
import type { MoveDirectionType } from '$lib/models/Figure';

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
  modeState: {
  };
  testModeOverrides: {
    nextComputerMove?: { direction: MoveDirectionType; distance: number };
  };
}

export interface GameStateConfig {
  size?: number;
  players?: Player[];
  testMode?: boolean;
  initialPosition?: { row: number; col: number };
}

export function createInitialState(config: GameStateConfig = {}): GameState {
  const size = config.size ?? 4;
  const players = config.players ?? [
    { id: 1, type: 'human', name: 'Гравець', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
    { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0, color: '#457b9d', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
  ];
  
  const { row: initialRow, col: initialCol } = config.initialPosition ?? getRandomCell(size);
  
  const board = createEmptyBoard(size);
  board[initialRow][initialCol] = 1;

  // НАВІЩО: Це ключове виправлення. При створенні нового стану гри ми
  // одразу читаємо поточний стан testModeStore. Це гарантує, що
  // testModeOverrides будуть встановлені з самого початку, вирішуючи
  // проблему стану гонитви (race condition).
  const currentTestModeState = get(testModeStore);
  const initialOverrides: GameState['testModeOverrides'] = {};
  if (currentTestModeState.isEnabled && currentTestModeState.computerMoveMode === 'manual' && currentTestModeState.manualComputerMove.direction && currentTestModeState.manualComputerMove.distance) {
    initialOverrides.nextComputerMove = {
      direction: currentTestModeState.manualComputerMove.direction as MoveDirectionType,
      distance: currentTestModeState.manualComputerMove.distance
    };
  }
  
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
    modeState: {
    },
    testModeOverrides: initialOverrides, // Встановлюємо початкові перевизначення
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