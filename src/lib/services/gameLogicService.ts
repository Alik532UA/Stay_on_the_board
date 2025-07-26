// --- Чисті функції та константи для ігрової логіки (ex-gameCore.ts) ---

export type Direction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right';
export interface Move {
  row: number;
  col: number;
  direction: Direction;
  distance: number;
}
export interface GameState {
  score: number;
  penaltyPoints: number;
  boardSize: number;
  movesInBlockMode: number;
  jumpedBlockedCells: number;
  finishedByFinishButton: boolean;
  noMovesClaimsCount: number;
}

export function createEmptyBoard(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function getRandomCell(size: number): { row: number; col: number } {
  return {
    row: Math.floor(Math.random() * size),
    col: Math.floor(Math.random() * size)
  };
}

export function getAvailableMoves(
  row: number,
  col: number,
  size: number,
  cellVisitCounts: Record<string, number> = {},
  blockOnVisitCount: number = 0
): Move[] {
  if (row === null || col === null) return [];
  const moves: Move[] = [];
  const directions: { dr: number; dc: number; direction: Direction }[] = [
    { dr: -1, dc: 0, direction: 'up' },
    { dr: 1, dc: 0, direction: 'down' },
    { dr: 0, dc: -1, direction: 'left' },
    { dr: 0, dc: 1, direction: 'right' },
    { dr: -1, dc: -1, direction: 'up-left' },
    { dr: -1, dc: 1, direction: 'up-right' },
    { dr: 1, dc: -1, direction: 'down-left' },
    { dr: 1, dc: 1, direction: 'down-right' },
  ];
  const visitMap = cellVisitCounts;
  const isBlocked = (r: number, c: number) => {
    const visitCount = visitMap[`${r}-${c}`] || 0;
    return visitCount > blockOnVisitCount;
  };

  for (const { dr, dc, direction } of directions) {
    for (let dist = 1; dist < size; dist++) {
      const nr = row + dr * dist;
      const nc = col + dc * dist;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) {
        break;
      }
      if (!isBlocked(nr, nc)) {
        moves.push({ row: nr, col: nc, direction, distance: dist });
      }
    }
  }
  return moves;
}

export const dirMap: Record<Direction, [number, number]> = {
  'up': [-1, 0],
  'down': [1, 0],
  'left': [0, -1],
  'right': [0, 1],
  'up-left': [-1, -1],
  'up-right': [-1, 1],
  'down-left': [1, -1],
  'down-right': [1, 1]
};

export const numToDir: Record<string, Direction> = {
  '1': 'down-left',
  '2': 'down',
  '3': 'down-right',
  '4': 'left',
  '6': 'right',
  '7': 'up-left',
  '8': 'up',
  '9': 'up-right'
};

export const oppositeDirections: Record<Direction, Direction> = {
  'up': 'down',
  'down': 'up',
  'left': 'right',
  'right': 'left',
  'up-left': 'down-right',
  'down-right': 'up-left',
  'up-right': 'down-left',
  'down-left': 'up-right'
};

export interface FinalScore {
  baseScore: number;
  totalPenalty: number;
  sizeBonus: number;
  blockModeBonus: number;
  noMovesBonus: number;
  finishBonus: number;
  jumpBonus: number;
  totalScore: number;
}

export function calculateFinalScore(state: GameState): FinalScore {
  const { score, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells } = state;
  
  const baseScore = score;
  const totalPenalty = penaltyPoints;
  let sizeBonus = 0;
  let percent = 0;
  if (baseScore > 0) {
    percent = (boardSize * boardSize) / 100;
    sizeBonus = Math.round(baseScore * percent);
  }
  const blockModeBonus = movesInBlockMode;
  const noMovesBonus = boardSize * (state.noMovesClaimsCount || 0);
  const finishBonus = state.finishedByFinishButton ? boardSize : 0;
  const jumpBonus = jumpedBlockedCells;
  const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus - totalPenalty + noMovesBonus + finishBonus;
  return {
    baseScore,
    totalPenalty,
    sizeBonus,
    blockModeBonus,
    jumpBonus,
    noMovesBonus,
    totalScore,
    finishBonus
  };
}

export function countJumpedCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cellVisitCounts: Record<string, number>,
  blockOnVisitCount: number
): number {
  let jumpedCount = 0;
  const dr = Math.sign(endRow - startRow);
  const dc = Math.sign(endCol - startCol);
  const distance = Math.max(Math.abs(endRow - startRow), Math.abs(endCol - startCol));
  for (let i = 1; i < distance; i++) {
    const currentRow = startRow + i * dr;
    const currentCol = startCol + i * dc;
    const visitCount = cellVisitCounts[`${currentRow}-${currentCol}`] || 0;
    if (visitCount > blockOnVisitCount) {
      jumpedCount++;
    }
  }
  return jumpedCount;
}

// --- Мутатори стану (ex-gameActions.ts) ---
import { get } from 'svelte/store';
import { gameState, createInitialState } from '../stores/gameState.js';
import { playerInputStore } from '../stores/playerInputStore.js';
import { settingsStore } from '../stores/settingsStore.js';

/**
 * @file Contains all pure functions (actions) that mutate the game's state.
 * These are simple mutators that work exclusively with gameState and playerInputStore.
 */

export function resetGame(options: { newSize?: number } = {}) {
  const { newSize } = options;
  settingsStore.updateSettings({ showQueen: true, showMoves: true });
  const currentState = get(gameState);
  const size = newSize ?? currentState.boardSize;

  const newState = createInitialState();
  newState.boardSize = size;

  const { row, col } = getRandomCell(size);
  
  newState.playerRow = row;
  newState.playerCol = col;
  newState.board = createEmptyBoard(size);
  newState.board[row][col] = 1;
  newState.moveHistory = [{ pos: { row, col }, blocked: [], visits: {} }];
  newState.availableMoves = getAvailableMoves(row, col, size, {}, get(settingsStore).blockOnVisitCount);

  gameState.set(newState);

  playerInputStore.set({
    selectedDirection: null,
    selectedDistance: null,
    distanceManuallySelected: false,
    isMoveInProgress: false,
  });
}

export function setDirection(dir: Direction) {
  playerInputStore.update(state => {
    const { boardSize } = get(gameState);
    const maxDist = boardSize - 1;
    let newDistance = state.selectedDistance;
    let newManuallySelected = state.distanceManuallySelected;

    if (state.selectedDirection !== dir) {
      if (!state.distanceManuallySelected) {
        newDistance = 1;
        newManuallySelected = false;
      }
    } else {
      if (!state.distanceManuallySelected) {
        newDistance = (!state.selectedDistance || state.selectedDistance >= maxDist) ? 1 : state.selectedDistance + 1;
        newManuallySelected = false;
      }
    }
    return { ...state, selectedDirection: dir, selectedDistance: newDistance, distanceManuallySelected: newManuallySelected };
  });
}

export function setDistance(dist: number) {
  playerInputStore.update(state => ({ ...state, selectedDistance: dist, distanceManuallySelected: true }));
}

export function performMove(newRow: number, newCol: number) {
  gameState.update(state => {
    const { playerRow, playerCol, boardSize } = state;
    if (playerRow === null || playerCol === null) return state;

    const newBoard = state.board.map(row => row.slice());
    if (playerRow >= 0 && playerRow < boardSize && playerCol >= 0 && playerCol < boardSize) {
      newBoard[playerRow][playerCol] = 0;
    }
    if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
      newBoard[newRow][newCol] = 1;
    }
    const newVisitCounts = { ...state.cellVisitCounts };
    if (get(settingsStore).blockModeEnabled) {
      const cellKey = `${playerRow}-${playerCol}`;
      newVisitCounts[cellKey] = (newVisitCounts[cellKey] || 0) + 1;
    }
    return {
      ...state,
      board: newBoard,
      playerRow: newRow,
      playerCol: newCol,
      cellVisitCounts: newVisitCounts,
      moveHistory: [...state.moveHistory, { pos: { row: newRow, col: newCol }, blocked: [], visits: newVisitCounts }],
    };
  });
  updateAvailableMoves();
}

export function updateAvailableMoves() {
  gameState.update(state => {
    const { playerRow, playerCol, boardSize, cellVisitCounts } = state;
    if (playerRow === null || playerCol === null) return state;
    const { blockOnVisitCount } = get(settingsStore);
    const newAvailableMoves = getAvailableMoves(playerRow, playerCol, boardSize, cellVisitCounts, blockOnVisitCount);
    return { ...state, availableMoves: newAvailableMoves };
  });
} 