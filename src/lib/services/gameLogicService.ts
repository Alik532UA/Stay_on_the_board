// --- Чисті функції та константи для ігрової логіки (ex-gameCore.ts) ---
import { Figure, MoveDirection } from '../models/Figure';
import type { MoveDirectionType } from '../models/Figure';
import { get } from 'svelte/store';
import { playerInputStore } from '../stores/playerInputStore';
import { gameState, createInitialState, type Player } from '../stores/gameState'; // Тепер цей імпорт безпечний
import { getAvailableMoves, isCellBlocked } from '$lib/utils/boardUtils.ts'; // Імпортуємо чисті функції
import { settingsStore } from '../stores/settingsStore.js';
import { stateManager } from './stateManager';
import { localGameStore } from '../stores/localGameStore.js';
import { logService } from './logService.js';


export type Direction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right';
export interface Move {
  row: number;
  col: number;
  direction: Direction;
  distance: number;
}
export interface GameState {
  players: Player[];
  penaltyPoints: number;
  boardSize: number;
  movesInBlockMode: number;
  jumpedBlockedCells: number;
  finishedByFinishButton: boolean;
  noMovesClaimsCount: number;
  noMovesBonus: number;
  distanceBonus: number; // Бонус за ходи на відстань більше 1
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
  distanceBonus: number; // Бонус за відстань
  totalScore: number;
}

export function calculateFinalScore(state: GameState): FinalScore {
  const { players, penaltyPoints, boardSize, movesInBlockMode, jumpedBlockedCells, finishedByFinishButton, noMovesBonus, distanceBonus } = state;
  
  const baseScore = players.reduce((acc, p) => acc + p.score, 0);
  const totalPenalty = penaltyPoints;
  let sizeBonus = 0;
  if (baseScore > 0) {
    const percent = (boardSize * boardSize) / 100;
    sizeBonus = Math.round(baseScore * percent);
  }
  const blockModeBonus = movesInBlockMode;
  const finishBonus = finishedByFinishButton ? boardSize : 0;
  const jumpBonus = jumpedBlockedCells;
  
  const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus + (distanceBonus || 0) - totalPenalty + (noMovesBonus || 0) + finishBonus;
  
  return {
    baseScore,
    totalPenalty,
    sizeBonus,
    blockModeBonus,
    jumpBonus,
    noMovesBonus: noMovesBonus || 0,
    finishBonus,
    distanceBonus: distanceBonus || 0,
    totalScore
  };
}

export function countJumpedCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cellVisitCounts: Record<string, number>,
  blockOnVisitCount: number,
  blockModeEnabled: boolean = false
): number {
  // Якщо режим блокування вимкнений, не рахуємо перестрибнуті клітинки
  if (!blockModeEnabled) {
    return 0;
  }
  
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
  settings: any, // Використовуємо any для доступу до всіх полів settingsStore
  distance: number = 1, // Додаємо параметр distance для розрахунку бонусних балів
  direction?: string // Додаємо параметр direction для перевірки "дзеркальних" ходів
): { players: Player[]; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number; bonusPoints: number; distanceBonus: number; currentJumpedCount: number; penaltyPointsForMove: number; } {
  
  const newPlayers = JSON.parse(JSON.stringify(currentState.players)); // Deep copy
  const currentPlayer = newPlayers[playerIndex];
  const isHumanMove = currentPlayer?.type === 'human';
  let newPenaltyPoints = currentState.penaltyPoints;
  let newMovesInBlockMode = currentState.movesInBlockMode;
  let newJumpedBlockedCells = currentState.jumpedBlockedCells;
  let newBonusPoints = 0; // Додаємо змінну для бонусних балів
  let newDistanceBonus = currentState.distanceBonus || 0; // Додаємо змінну для бонусів за відстань
  let penaltyPointsForMove = 0;

  // 1. Нараховуємо бали тільки за хід гравця
  if (isHumanMove) {
    if (!settings.showBoard) {
      currentPlayer.score += 3;
    } else if (!settings.showQueen) {
      currentPlayer.score += 2;
    } else {
      currentPlayer.score += 1;
    }
  }

  // 2. Перевірка на штраф за "дзеркальний" хід
  // Для локальних ігор штрафні бали не додаються до загального penaltyPoints,
  // а тільки до рахунку конкретного гравця в localGameStore
  const humanPlayersCount = currentState.players.filter((p: any) => p.type === 'human').length;
  
  logService.logic(`calculateMoveScore: humanPlayersCount = ${humanPlayersCount}, playerIndex = ${playerIndex}, isHumanMove = ${isHumanMove}`);
  
  // Перевіряємо "дзеркальний" хід тільки для ходів гравця (не комп'ютера)
  if (isHumanMove && direction && currentState.moveQueue.length >= 1) {
    // Знаходимо останній хід комп'ютера
    const lastComputerMove = currentState.moveQueue[currentState.moveQueue.length - 1];
    
    // Перевіряємо чи це був хід комп'ютера (player !== 0)
    if (lastComputerMove && lastComputerMove.player !== 0) {
      const isMirror = isMirrorMove(
        direction,
        distance,
        lastComputerMove.direction,
        lastComputerMove.distance
      );
      
      logService.logic(`calculateMoveScore: перевіряємо "дзеркальний" хід:`, {
        currentMove: { direction, distance },
        computerMove: { direction: lastComputerMove.direction, distance: lastComputerMove.distance },
        isMirrorMove: isMirror
      });
      
      if (isMirror) {
        // Для локальних ігор не додаємо штрафні бали до загального penaltyPoints
        if (humanPlayersCount <= 1) {
          logService.score(`calculateMoveScore: додаємо 2 штрафних бали до загального penaltyPoints (single player game)`);
          newPenaltyPoints += 2;
        } else {
          logService.score(`calculateMoveScore: НЕ додаємо штрафні бали до загального penaltyPoints (local game), будуть додані до гравця в performMove`);
          penaltyPointsForMove = 2;
        }
      }
    }
  } else if (!isHumanMove) {
    logService.logic(`calculateMoveScore: пропускаємо перевірку "дзеркального" ходу для комп'ютера`);
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
    settings.blockOnVisitCount,
    settings.blockModeEnabled
  );
  newJumpedBlockedCells += jumpedCount;

  // 5. Підрахунок бонусних балів за ходи на відстань більше 1
  if (distance > 1) {
    newDistanceBonus += 1; // Бонус = +1 бал за хід на відстань більше 1 (незалежно від відстані)
    newBonusPoints += 1; // Також додаємо до загальних бонусних балів для локальної гри
    logService.score(`calculateMoveScore: додаємо 1 бонусний бал за хід на відстань ${distance}`);
  }

  // 6. Підрахунок бонусних балів за перестрибування заблокованих клітинок
  // Бонуси за перестрибування нараховуються тільки коли blockModeEnabled = true
  if (jumpedCount > 0 && settings.blockModeEnabled) {
    newBonusPoints += jumpedCount; // Бонус = кількість перестрибнутих заблокованих клітинок
    logService.score(`calculateMoveScore: додаємо ${jumpedCount} бонусних балів за перестрибування ${jumpedCount} заблокованих клітинок`);
  } else if (jumpedCount > 0 && !settings.blockModeEnabled) {
    logService.score(`calculateMoveScore: пропускаємо бонуси за перестрибування (blockModeEnabled = false)`);
  }

  return {
    players: newPlayers,
    penaltyPoints: newPenaltyPoints,
    movesInBlockMode: newMovesInBlockMode,
    jumpedBlockedCells: newJumpedBlockedCells,
    bonusPoints: newBonusPoints,
    distanceBonus: newDistanceBonus,
    currentJumpedCount: jumpedCount,
    penaltyPointsForMove: penaltyPointsForMove
  };
}

// --- Допоміжні функції ---

/**
 * Перевіряє чи є хід "дзеркальним" відносно попереднього ходу комп'ютера
 * @param currentDirection - напрямок поточного ходу гравця
 * @param currentDistance - відстань поточного ходу гравця
 * @param computerDirection - напрямок попереднього ходу комп'ютера
 * @param computerDistance - відстань попереднього ходу комп'ютера
 * @returns true якщо хід є "дзеркальним"
 */
function isMirrorMove(
  currentDirection: string,
  currentDistance: number,
  computerDirection: string,
  computerDistance: number
): boolean {
  // Визначаємо протилежні напрямки
  const oppositeDirections: Record<string, string> = {
    'up': 'down',
    'down': 'up',
    'left': 'right',
    'right': 'left',
    'up-left': 'down-right',
    'up-right': 'down-left',
    'down-left': 'up-right',
    'down-right': 'up-left'
  };

  const oppositeDirection = oppositeDirections[computerDirection];
  
  // Перевіряємо чи поточний хід у протилежному напрямку
  if (currentDirection !== oppositeDirection) {
    return false;
  }

  // Перевіряємо чи відстань гравця менша або дорівнює відстані комп'ютера
  return currentDistance <= computerDistance;
}

// --- Мутатори стану (ex-gameActions.ts) ---

/**
 * @file Contains all pure functions (actions) that mutate the game's state.
 * These are simple mutators that work exclusively with gameState and playerInputStore.
 */

export function resetGame(options: { newSize?: number; players?: Player[]; settings?: any } = {}) {
  const newSize = options.newSize ?? get(gameState).boardSize;
  
  const newState = createInitialState({
    size: newSize,
    players: options.players
  });
  
  gameState.set(newState);
  
  // Застосовуємо налаштування з локальної гри, якщо вони передані
  if (options.settings) {
    settingsStore.updateSettings({
      blockModeEnabled: options.settings.blockModeEnabled,
      autoHideBoard: options.settings.autoHideBoard,
      lockSettings: options.settings.lockSettings,
      // Гарантуємо, що дошка видима на початку гри
      showBoard: true,
      showQueen: true,
      showMoves: true
    });
  } else {
    // Стандартні налаштування видимості для нової гри
    settingsStore.updateSettings({
      showBoard: true,
      showQueen: true,
      showMoves: true
    });
  }
  
  // Скидаємо рахунки гравців в локальній грі
  const humanPlayersCount = newState.players.filter(p => p.type === 'human').length;
  if (humanPlayersCount > 1) {
    localGameStore.resetScores();
  }
  
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
  
  logService.logic('setDirection: встановлено напрямок', { dir, newDistance, newManuallySelected });
}

export function setDistance(dist: number) {
  // Оновлюємо playerInputStore
  playerInputStore.update(state => ({
    ...state,
    selectedDistance: dist,
    distanceManuallySelected: true
  }));
  
  logService.logic('setDistance: встановлено відстань', { dist });
}

/**
 * Виконує хід (гравця або комп'ютера)
 * @param direction Напрямок ходу
 * @param distance Відстань ходу
 * @param playerIndex Індекс гравця (0 для гравця, 1 для комп'ютера)
 */
export async function performMove(direction: MoveDirectionType, distance: number, playerIndex: number = 0) {
  logService.logic('performMove: початок з параметрами:', { direction, distance, playerIndex });
  
  const currentState = get(gameState);
  const settings = get(settingsStore);
  const figure = new Figure(currentState.playerRow, currentState.playerCol, currentState.boardSize);

  const newPosition = figure.calculateNewPosition(direction, distance);

  // 1. Перевірка виходу за межі дошки
  if (!figure.isValidPosition(newPosition.row, newPosition.col)) {
    logService.logic('performMove: вихід за межі дошки');
    return { success: false, reason: 'out_of_bounds' };
  }

  // 2. Перевірка ходу на заблоковану клітинку
  if (isCellBlocked(newPosition.row, newPosition.col, currentState.cellVisitCounts, settings)) {
    logService.logic('performMove: хід на заблоковану клітинку');
    return { success: false, reason: 'blocked_cell' };
  }

  // --- Якщо всі перевірки пройдено, виконуємо хід ---
  
  const updatedCellVisitCounts = { ...currentState.cellVisitCounts };
  const startCellKey = `${currentState.playerRow}-${currentState.playerCol}`;
  updatedCellVisitCounts[startCellKey] = (updatedCellVisitCounts[startCellKey] || 0) + 1;

  const scoreChanges = calculateMoveScore(currentState, newPosition, playerIndex, settings, distance, direction);

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
    players: scoreChanges.players,
    penaltyPoints: scoreChanges.penaltyPoints,
    movesInBlockMode: scoreChanges.movesInBlockMode,
    jumpedBlockedCells: scoreChanges.jumpedBlockedCells,
    distanceBonus: scoreChanges.distanceBonus
  };

  await stateManager.applyChanges('PERFORM_MOVE', changes, `Move: ${direction}${distance}`);
  
  // Оновлюємо рахунок гравця в локальній грі
  const currentStateAfterMove = get(gameState);
  const humanPlayersCount = currentStateAfterMove.players.filter(p => p.type === 'human').length;
  
  // Перевіряємо "дзеркальний" хід для single player гри (гра з комп'ютером)
  if (humanPlayersCount <= 1 && playerIndex === 0) { // Гравець (не комп'ютер)
    // Додаємо бонусні бали за відстань до GameState для гри з комп'ютером
    if (scoreChanges.distanceBonus > 0) {
      logService.score(`performMove (single player): додаємо ${scoreChanges.distanceBonus} бонусних балів за відстань до GameState`);
    }
    
    if (currentState.moveQueue.length >= 1) {
      // Знаходимо останній хід комп'ютера
      const lastComputerMove = currentState.moveQueue[currentState.moveQueue.length - 1];
      
      // Перевіряємо чи це був хід комп'ютера (player !== 0)
      if (lastComputerMove && lastComputerMove.player !== 0) {
        const isMirror = isMirrorMove(
          direction,
          distance,
          lastComputerMove.direction,
          lastComputerMove.distance
        );
        
        logService.logic(`performMove (single player): перевіряємо "дзеркальний" хід:`, {
          currentMove: { direction, distance },
          computerMove: { direction: lastComputerMove.direction, distance: lastComputerMove.distance },
          isMirrorMove: isMirror
        });
        
        if (isMirror) {
          logService.score(`performMove (single player): додаємо 2 штрафних бали за "дзеркальний" хід`);
          // Штрафні бали вже додані в calculateMoveScore для single player гри
        }
      }
    }
  }
  // Логіка нарахування балів для локальної гри тепер знаходиться в `LocalGameMode`
  // і оновлює `gameState` напряму. `localGameStore` більше не використовується для рахунку.
  
  logService.logic('performMove: завершено успішно');
  return { success: true, newPosition, bonusPoints: scoreChanges.bonusPoints, penaltyPoints: scoreChanges.penaltyPointsForMove };
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