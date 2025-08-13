// --- Чисті функції та константи для ігрової логіки (ex-gameCore.ts) ---
import { Figure, MoveDirection } from '../models/Figure';
import type { MoveDirectionType } from '../models/Figure';
import { get } from 'svelte/store';
import { playerInputStore } from '../stores/playerInputStore';
import { gameState, createInitialState, type Player } from '../stores/gameState'; // Тепер цей імпорт безпечний
import { getAvailableMoves, isCellBlocked, isMirrorMove } from '$lib/utils/boardUtils.ts'; // Імпортуємо чисті функції
import { lastPlayerMove } from '$lib/stores/derivedState';
import { settingsStore } from '../stores/settingsStore';
import { stateManager } from './stateManager';
import { localGameStore } from '../stores/localGameStore.js';
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
  const newSize = options.newSize ?? currentState.boardSize;
  const { testMode } = get(settingsStore);
  
  const newState = createInitialState({
    size: newSize,
    players: options.players,
    testMode
  });

  // Якщо гравці передані, використовуємо їх
  if (options.players) {
    newState.players = options.players;
  }
  
  gameState.set(newState);
  
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
  const humanPlayersCount = newState.players.filter((p: Player) => p.type === 'human').length;
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
export async function performMove(
  direction: MoveDirectionType,
  distance: number,
  playerIndex: number = 0,
  currentState: any,
  settings: any
) {
  logService.logic('performMove: початок з параметрами:', { direction, distance, playerIndex });
  
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

  const lastMove = { direction, distance };

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
    blockModeEnabled: settings.blockModeEnabled // <-- ДОДАЙ ЦЕЙ РЯДОК
  }];

  const changes = {
    board: newBoard,
    playerRow: newPosition.row,
    playerCol: newPosition.col,
    cellVisitCounts: updatedCellVisitCounts,
    moveQueue: updatedMoveQueue,
    moveHistory: updatedMoveHistory,
    players: scoreChanges.players,
    penaltyPoints: scoreChanges.penaltyPoints,
    movesInBlockMode: scoreChanges.movesInBlockMode,
    jumpedBlockedCells: scoreChanges.jumpedBlockedCells,
    distanceBonus: scoreChanges.distanceBonus,
    isFirstMove: false
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
    return null;
  }

  const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  return {
    direction: randomMove.direction,
    distance: randomMove.distance
  };
}
