// --- Чисті функції та константи для ігрової логіки (ex-gameCore.ts) ---
import { Figure, MoveDirection } from '../models/Figure';
import type { MoveDirectionType } from '../models/Figure';
import { get } from 'svelte/store';
import { playerInputStore } from '../stores/playerInputStore';
import { gameState, createInitialState } from '../stores/gameState';
import type { Player } from '$lib/models/player';
import { gameStateMutator } from './gameStateMutator';
import { getAvailableMoves, isCellBlocked, isMirrorMove } from '$lib/utils/boardUtils.ts'; // Імпортуємо чисті функції
import { lastPlayerMove } from '$lib/stores/derivedState';
import { settingsStore } from '../stores/settingsStore';
import { logService } from './logService.js';
import { testModeStore } from '$lib/stores/testModeStore';
import { calculateMoveScore } from './scoreService';
import type { Direction } from '$lib/utils/gameUtils';

// --- Мутатори стану (ex-gameActions.ts) ---

/**
 * @file Contains all pure functions (actions) that mutate the game's state.
 * These are simple mutators that work exclusively with gameState and playerInputStore.
 */

export function resetGame(options: { newSize?: number; players?: Player[]; settings?: any } = {}, currentState: any) {
  const newSize = options.newSize ?? currentState?.boardSize ?? 4;
  
  gameStateMutator.resetGame({ newSize, players: options.players });

  // Застосовуємо налаштування з локальної гри, якщо вони передані
  if (options.settings) {
    settingsStore.updateSettings({
      blockModeEnabled: options.settings.blockModeEnabled,
      autoHideBoard: options.settings.autoHideBoard,
      lockSettings: options.settings.lockSettings,
      // Гарантуємо, що дошка видима на початку гри
      showBoard: true,
      showPiece: true,
      showMoves: true
    });
  } else {
    // Стандартні налаштування видимості для нової гри
    settingsStore.updateSettings({
      showBoard: true,
      showPiece: true,
      showMoves: true
    });
  }
  
  // Скидаємо рахунки гравців в локальній грі
  const newState = get(gameState);
  const humanPlayersCount = newState.players.filter((p: Player) => p.type === 'human').length;
  if (humanPlayersCount > 1) {
    gameStateMutator.resetScores();
  }
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
  
  logService.logicMove('setDirection: встановлено напрямок', { dir, newDistance, newManuallySelected });
}

export function setDistance(dist: number) {
  // Оновлюємо playerInputStore
  playerInputStore.update(state => ({
    ...state,
    selectedDistance: dist,
    distanceManuallySelected: true
  }));
  
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

function _applyMoveToState(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  direction: MoveDirectionType,
  distance: number,
  scoreChanges: any,
  settings: any
) {
  const updatedCellVisitCounts = { ...currentState.cellVisitCounts };
  const startCellKey = `${currentState.playerRow}-${currentState.playerCol}`;
  updatedCellVisitCounts[startCellKey] = (updatedCellVisitCounts[startCellKey] || 0) + 1;

  const newBoard = currentState.board.map((row: number[]) => [...row]);
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
    blockModeEnabled: settings.blockModeEnabled
  }];

  const updatedPlayers = [...currentState.players];
  updatedPlayers[playerIndex] = {
    ...updatedPlayers[playerIndex],
    score: updatedPlayers[playerIndex].score + scoreChanges.baseScoreChange
  };

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
    isFirstMove: false
  };
}

/**
 * Виконує хід (гравця або комп'ютера)
 * @param direction Напрямок ходу
 * @param distance Відстань ходу
 * @param playerIndex Індекс гравця (0 для гравця, 1 для комп'ютера)
 */
export async function performMove(
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

  // Логіка для "дзеркального" ходу та бонусів тепер обробляється в LocalGameMode та VsComputerGameMode,
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
  const testModeState = get(testModeStore);
  logService.testMode('gameLogicService: отримано стан testModeStore', testModeState);

  if (testModeState.computerMoveMode === 'manual' && testModeState.manualComputerMove.direction && testModeState.manualComputerMove.distance) {
    logService.testMode('gameLogicService: виконується ручний хід', testModeState.manualComputerMove);
    return {
      direction: testModeState.manualComputerMove.direction as MoveDirectionType,
      distance: testModeState.manualComputerMove.distance
    };
  }

  logService.testMode('gameLogicService: виконується випадковий хід');
  const state = get(gameState);
  const settings = get(settingsStore);
  const availableMoves = getAvailableMoves(
    state.playerRow,
    state.playerCol,
    state.boardSize,
    state.cellVisitCounts,
    settings.blockOnVisitCount,
    state.board,
    settings.blockModeEnabled,
    null
  );

  if (availableMoves.length === 0) {
    logService.logicAI('getComputerMove: немає доступних ходів');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  const randomMove = availableMoves[randomIndex];
  
  logService.logicAI('getComputerMove: знайдено доступні ходи', availableMoves);
  logService.logicAI('getComputerMove: обрано випадковий хід', randomMove);
  
  return randomMove;
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
