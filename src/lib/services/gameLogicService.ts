// --- Чисті функції та константи для ігрової логіки (ex-gameCore.ts) ---
import { Figure, MoveDirection } from '../models/Figure';
import type { MoveDirectionType } from '../models/Figure';
import { get } from 'svelte/store';
import { gameState, createInitialState } from '../stores/gameState';
import type { Player } from '$lib/models/player';
import { gameStateMutator } from './gameStateMutator';
import { isCellBlocked, isMirrorMove } from '$lib/utils/boardUtils.ts'; // Імпортуємо чисті функції
import { settingsStore } from '../stores/settingsStore';
import { logService } from './logService.js';
import { calculateMoveScore } from './scoreService';
import type { Direction } from '$lib/utils/gameUtils';
import { availableMovesService } from './availableMovesService';
import { aiService } from './aiService';

// --- Мутатори стану (ex-gameActions.ts) ---

/**
 * @file Contains all pure functions (actions) that mutate the game's state.
 * These are simple mutators that work exclusively with gameState.
 */

// ВИДАЛЕНО: функція resetGame. Її відповідальність перенесена в GameMode.

export function setDirection(dir: Direction) {
  const state = get(gameState);
  if (!state) return;

  const { boardSize, selectedDirection, selectedDistance } = state;
  const maxDist = boardSize - 1;
  let newDistance = selectedDistance;

  if (selectedDirection !== dir) {
    newDistance = 1;
  } else {
    newDistance = (!selectedDistance || selectedDistance >= maxDist) ? 1 : selectedDistance + 1;
  }
  
  gameStateMutator.applyMove({
    selectedDirection: dir,
    selectedDistance: newDistance,
  });
  
  logService.logicMove('setDirection: встановлено напрямок', { dir, newDistance });
}

export function setDistance(dist: number) {
  gameStateMutator.applyMove({
    selectedDistance: dist,
  });
  
  logService.logicMove('setDistance: встановлено відстань', { dist });
}

function _validateMove(
  newPosition: { row: number; col: number },
  figure: Figure,
  currentState: any,
  settings: any
): { success: boolean; reason?: string } {
  // 1. Перевірка виходу за межі дошки
  if (!figure.isValidPosition(newPosition.row, newPosition.col)) {
    logService.logicMove('performMove: вихід за межі дошки');
    return { success: false, reason: 'out_of_bounds' };
  }

  // 2. Перевірка ходу на заблоковану клітинку
  if (isCellBlocked(newPosition.row, newPosition.col, currentState.cellVisitCounts, settings)) {
    logService.logicMove('performMove: хід на заблоковану клітинку');
    return { success: false, reason: 'blocked_cell' };
  }

  return { success: true };
}

function _createUpdatedVisitCounts(currentState: any) {
  const updatedCellVisitCounts = { ...currentState.cellVisitCounts };
  const startCellKey = `${currentState.playerRow}-${currentState.playerCol}`;
  updatedCellVisitCounts[startCellKey] = (updatedCellVisitCounts[startCellKey] || 0) + 1;
  return updatedCellVisitCounts;
}

function _createUpdatedBoard(currentState: any, newPosition: { row: number; col: number }) {
  const newBoard = currentState.board.map((row: number[]) => [...row]);
  if (currentState.playerRow !== null && currentState.playerCol !== null) {
    newBoard[currentState.playerRow][currentState.playerCol] = 0;
  }
  newBoard[newPosition.row][newPosition.col] = 1;
  return newBoard;
}

function _createUpdatedMoveQueue(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  direction: MoveDirectionType,
  distance: number
) {
  return [...currentState.moveQueue, {
    player: playerIndex + 1,
    direction,
    distance,
    to: { row: newPosition.row, col: newPosition.col }
  }];
}

function _createUpdatedMoveHistory(
  currentState: any,
  newPosition: { row: number; col: number },
  updatedCellVisitCounts: any,
  settings: any
) {
  return [...currentState.moveHistory, {
    pos: { row: newPosition.row, col: newPosition.col },
    blocked: [] as {row: number, col: number}[],
    visits: { ...updatedCellVisitCounts },
    blockModeEnabled: settings.blockModeEnabled
  }];
}

function _createUpdatedPlayers(currentState: any, playerIndex: number, scoreChanges: any) {
  const updatedPlayers = [...currentState.players];
  updatedPlayers[playerIndex] = {
    ...updatedPlayers[playerIndex],
    score: updatedPlayers[playerIndex].score + scoreChanges.baseScoreChange
  };
  return updatedPlayers;
}

function _applyMoveToState(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  direction: MoveDirectionType,
  distance: number,
  scoreChanges: any,
  settings: any
) {
  const updatedCellVisitCounts = _createUpdatedVisitCounts(currentState);
  const newBoard = _createUpdatedBoard(currentState, newPosition);
  const updatedMoveQueue = _createUpdatedMoveQueue(currentState, newPosition, playerIndex, direction, distance);
  const updatedMoveHistory = _createUpdatedMoveHistory(currentState, newPosition, updatedCellVisitCounts, settings);
  const updatedPlayers = _createUpdatedPlayers(currentState, playerIndex, scoreChanges);

  return {
    board: newBoard,
    playerRow: newPosition.row,
    playerCol: newPosition.col,
    cellVisitCounts: updatedCellVisitCounts,
    moveQueue: updatedMoveQueue,
    moveHistory: updatedMoveHistory,
    players: updatedPlayers,
    penaltyPoints: currentState.penaltyPoints + scoreChanges.penaltyPoints,
    movesInBlockMode: currentState.movesInBlockMode + scoreChanges.movesInBlockModeChange,
    jumpedBlockedCells: currentState.jumpedBlockedCells + scoreChanges.jumpedBlockedCellsChange,
    distanceBonus: (currentState.distanceBonus || 0) + scoreChanges.distanceBonusChange,
    isFirstMove: false,
    lastMove: { direction, distance, player: playerIndex }
  };
}

/**
 * Виконує хід (гравця або комп'ютера)
 * @param direction Напрямок ходу
 * @param distance Відстань ходу
 * @param playerIndex Індекс гравця (0 для гравця, 1 для комп'ютера)
 */
export function performMove(
  direction: MoveDirectionType,
  distance: number,
  playerIndex: number = 0,
  currentState: any,
  settings: any
) {
  logService.logicMove('performMove: початок з параметрами:', { direction, distance, playerIndex });

  const figure = new Figure(currentState.playerRow, currentState.playerCol, currentState.boardSize);
  const newPosition = figure.calculateNewPosition(direction, distance);

  const validation = _validateMove(newPosition, figure, currentState, settings);
  if (!validation.success) {
    return { success: false, reason: validation.reason };
  }

  // --- Якщо всі перевірки пройдено, виконуємо хід ---
  const scoreChanges = calculateMoveScore(currentState, newPosition, playerIndex, settings, distance, direction);

  const changes = _applyMoveToState(currentState, newPosition, playerIndex, direction, distance, scoreChanges, settings);

  // Логіка для "дзеркального" ходу та бонусів тепер обробляється в LocalGameMode та TrainingGameMode,
  // які отримують `scoreChanges` і вирішують, як їх застосувати.
  // Це робить `performMove` більш чистою функцією, що відповідає лише за сам хід.

  logService.logicMove('performMove: завершено успішно');
  return {
    success: true,
    changes,
    newPosition,
    bonusPoints: scoreChanges.bonusPoints,
    penaltyPoints: scoreChanges.penaltyPointsForMove
  };
}


export function getComputerMove(): { direction: MoveDirectionType; distance: number } | null {
  return aiService.getComputerMove();
}

export function validatePlayerMove(changes: any, currentState: any): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (changes.playerRow !== undefined) {
    if (typeof changes.playerRow !== 'number' || changes.playerRow < 0 || changes.playerRow >= currentState.boardSize) {
      errors.push('playerRow must be a valid board coordinate');
    }
  }

  if (changes.playerCol !== undefined) {
    if (typeof changes.playerCol !== 'number' || changes.playerCol < 0 || changes.playerCol >= currentState.boardSize) {
      errors.push('playerCol must be a valid board coordinate');
    }
  }

  if (changes.playerRow !== undefined && changes.playerCol !== undefined) {
    if (isCellBlocked(changes.playerRow, changes.playerCol, currentState.cellVisitCounts, get(settingsStore))) {
      errors.push('Player cannot move to a blocked cell');
    }
  }

  return { errors, warnings };
}