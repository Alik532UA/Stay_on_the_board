// --- Чисті функції та константи для ігрової логіки (ex-gameCore.ts) ---
import { Figure, MoveDirection } from '../models/Figure';
import type { MoveDirectionType } from '../models/Figure';
import { get } from 'svelte/store';
import { playerInputStore } from '../stores/playerInputStore';
import { gameState, createInitialState } from '../stores/gameState'; // Тепер цей імпорт безпечний
import { getAvailableMoves, isCellBlocked } from '$lib/utils/boardUtils.ts'; // Імпортуємо чисті функції
import { settingsStore } from '../stores/settingsStore.js';
import { stateManager } from './stateManager';


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
  noMovesBonus: number;
}

// Функції createEmptyBoard, getRandomCell, getAvailableMoves були перенесені в boardUtils.ts

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
  const { score, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells, finishedByFinishButton, noMovesBonus } = state;
  
  const baseScore = score;
  const totalPenalty = penaltyPoints;
  let sizeBonus = 0;
  if (baseScore > 0) {
    const percent = (boardSize * boardSize) / 100;
    sizeBonus = Math.round(baseScore * percent);
  }
  const blockModeBonus = movesInBlockMode;
  const finishBonus = finishedByFinishButton ? boardSize : 0;
  const jumpBonus = jumpedBlockedCells;
  
  const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus - totalPenalty + (noMovesBonus || 0) + finishBonus;
  
  return {
    baseScore,
    totalPenalty,
    sizeBonus,
    blockModeBonus,
    jumpBonus,
    noMovesBonus: noMovesBonus || 0,
    finishBonus,
    totalScore
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

/**
 * Обчислює зміни рахунку для одного ходу.
 * @returns Зміни для стану гри.
 */
function calculateMoveScore(
  currentState: any, // Використовуємо any для доступу до всіх полів gameState
  newPosition: { row: number; col: number },
  playerIndex: number,
  settings: any // Використовуємо any для доступу до всіх полів settingsStore
): { score: number; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number } {
  
  let newScore = currentState.score;
  let newPenaltyPoints = currentState.penaltyPoints;
  let newMovesInBlockMode = currentState.movesInBlockMode;
  let newJumpedBlockedCells = currentState.jumpedBlockedCells;

  // 1. Нараховуємо бали тільки за хід гравця
  if (playerIndex === 0) {
    if (!settings.showBoard) {
      newScore += 3;
    } else if (!settings.showQueen) {
      newScore += 2;
    } else {
      newScore += 1;
    }
  }

  // 2. Перевірка на штраф за "дзеркальний" хід
  if (playerIndex === 0 && currentState.moveHistory.length >= 2) {
    const computerOriginPosition = currentState.moveHistory[currentState.moveHistory.length - 2].pos;
    // Перевіряємо чи це об'єкт (нова структура) або масив (стара структура)
    const computerRow = Array.isArray(computerOriginPosition) ? computerOriginPosition[0] : computerOriginPosition.row;
    const computerCol = Array.isArray(computerOriginPosition) ? computerOriginPosition[1] : computerOriginPosition.col;
    if (newPosition.row === computerRow && newPosition.col === computerCol) {
      newPenaltyPoints += 2;
    }
  }

  // 3. Підрахунок ходів у режимі блокування
  if (settings.blockModeEnabled) {
    newMovesInBlockMode += 1;
  }

  // 4. Підрахунок бонусів за перестрибування
  const jumpedCount = countJumpedCells(
    currentState.playerRow,
    currentState.playerCol,
    newPosition.row,
    newPosition.col,
    currentState.cellVisitCounts,
    settings.blockOnVisitCount
  );
  newJumpedBlockedCells += jumpedCount;

  return {
    score: newScore,
    penaltyPoints: newPenaltyPoints,
    movesInBlockMode: newMovesInBlockMode,
    jumpedBlockedCells: newJumpedBlockedCells,
  };
}

// --- Мутатори стану (ex-gameActions.ts) ---

/**
 * @file Contains all pure functions (actions) that mutate the game's state.
 * These are simple mutators that work exclusively with gameState and playerInputStore.
 */

export function resetGame(options: { newSize?: number } = {}) {
  const newSize = options.newSize ?? get(gameState).boardSize;
  const newState = createInitialState(newSize);
  
  gameState.set(newState);
  
  // Гарантуємо, що дошка та ферзь видимі на початку нової гри
  settingsStore.updateSettings({
    showBoard: true,
    showQueen: true,
    showMoves: true
  });
  
  // animationStore автоматично скидається при зміні gameId
}

export function setDirection(dir: Direction) {
  const currentInput = get(playerInputStore);
  const { boardSize } = get(gameState);
  const maxDist = boardSize - 1;
  let newDistance = currentInput.selectedDistance;
  let newManuallySelected = currentInput.distanceManuallySelected;

  if (currentInput.selectedDirection !== dir) {
    if (!currentInput.distanceManuallySelected) {
      newDistance = 1;
      newManuallySelected = false;
    }
  } else {
    if (!currentInput.distanceManuallySelected) {
      newDistance = (!currentInput.selectedDistance || currentInput.selectedDistance >= maxDist) ? 1 : currentInput.selectedDistance + 1;
      newManuallySelected = false;
    }
  }

  // Оновлюємо playerInputStore
  playerInputStore.update(state => ({
    ...state,
    selectedDirection: dir,
    selectedDistance: newDistance,
    distanceManuallySelected: newManuallySelected
  }));
  
  console.log('🎯 setDirection: встановлено напрямок', { dir, newDistance, newManuallySelected });
}

export function setDistance(dist: number) {
  // Оновлюємо playerInputStore
  playerInputStore.update(state => ({
    ...state,
    selectedDistance: dist,
    distanceManuallySelected: true
  }));
  
  console.log('🎯 setDistance: встановлено відстань', { dist });
}

/**
 * Виконує хід (гравця або комп'ютера)
 * @param direction Напрямок ходу
 * @param distance Відстань ходу
 * @param playerIndex Індекс гравця (0 для гравця, 1 для комп'ютера)
 */
export async function performMove(direction: MoveDirectionType, distance: number, playerIndex: number = 0) {
  console.log('🎮 performMove: початок з параметрами:', { direction, distance, playerIndex });
  
  const currentState = get(gameState);
  const settings = get(settingsStore);
  const figure = new Figure(currentState.playerRow, currentState.playerCol, currentState.boardSize);

  const newPosition = figure.calculateNewPosition(direction, distance);

  // 1. Перевірка виходу за межі дошки
  if (!figure.isValidPosition(newPosition.row, newPosition.col)) {
    console.log('❌ performMove: вихід за межі дошки');
    return { success: false, reason: 'out_of_bounds' };
  }

  // 2. Перевірка ходу на заблоковану клітинку
  if (isCellBlocked(newPosition.row, newPosition.col, currentState.cellVisitCounts, settings)) {
    console.log('❌ performMove: хід на заблоковану клітинку');
    return { success: false, reason: 'blocked_cell' };
  }

  // --- Якщо всі перевірки пройдено, виконуємо хід ---
  
  const updatedCellVisitCounts = { ...currentState.cellVisitCounts };
  const startCellKey = `${currentState.playerRow}-${currentState.playerCol}`;
  updatedCellVisitCounts[startCellKey] = (updatedCellVisitCounts[startCellKey] || 0) + 1;

  const scoreChanges = calculateMoveScore(currentState, newPosition, playerIndex, settings);

  const newAvailableMoves = getAvailableMoves(
    newPosition.row,
    newPosition.col,
    currentState.boardSize,
    updatedCellVisitCounts,
    settings.blockOnVisitCount,
    currentState.board,
    settings.blockModeEnabled // <-- Додай цей параметр
  );

  const newBoard = currentState.board.map(row => [...row]);
  if (currentState.playerRow !== null && currentState.playerCol !== null) {
    newBoard[currentState.playerRow][currentState.playerCol] = 0;
  }
  newBoard[newPosition.row][newPosition.col] = 1;

  const updatedMoveQueue = [...currentState.moveQueue, {
    player: playerIndex + 1,
    direction,
    distance,
    to: { row: newPosition.row, col: newPosition.col }
  }];

  const updatedMoveHistory = [...currentState.moveHistory, {
    pos: { row: newPosition.row, col: newPosition.col },
    blocked: [] as {row: number, col: number}[],
    visits: { ...updatedCellVisitCounts },
    blockModeEnabled: settings.blockModeEnabled // <-- ДОДАЙ ЦЕЙ РЯДОК
  }];

  const changes = {
    board: newBoard,
    playerRow: newPosition.row,
    playerCol: newPosition.col,
    cellVisitCounts: updatedCellVisitCounts,
    moveQueue: updatedMoveQueue,
    moveHistory: updatedMoveHistory,
    availableMoves: newAvailableMoves,
    ...scoreChanges
  };

  await stateManager.applyChanges('PERFORM_MOVE', changes, `Move: ${direction}${distance}`);
  
  console.log('🎮 performMove: завершено успішно');
  return { success: true, newPosition };
}

/**
 * Отримати доступні ходи для поточної позиції використовуючи клас Figure
 */
export function getAvailableMovesForFigure() {
  const currentState = get(gameState);
  const figure = new Figure(currentState.playerRow, currentState.playerCol, currentState.boardSize);
  return figure.getAvailableMoves();
}

/**
 * Перевірити чи валідний хід використовуючи клас Figure
 */
export function isValidMove(direction: MoveDirectionType, distance: number) {
  const currentState = get(gameState);
  const figure = new Figure(currentState.playerRow, currentState.playerCol, currentState.boardSize);
  return figure.canMove(direction, distance);
}

/**
 * Оновити доступні ходи
 */
export function updateAvailableMoves() {
  const availableMoves = getAvailableMovesForFigure();
  stateManager.applyChanges('UPDATE_AVAILABLE_MOVES', { availableMoves }, 'Update available moves');
} 