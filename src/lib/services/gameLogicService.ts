// src/lib/services/gameLogicService.ts
import { Figure, type MoveDirectionType } from '../models/Figure';
import { get } from 'svelte/store';
import { isCellBlocked, isMirrorMove } from '$lib/utils/boardUtils';
import { logService } from './logService.js';
import { calculateMoveScore } from './scoreService';
import type { Direction } from '$lib/utils/gameUtils';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';

export function setDirection(dir: Direction) {
  logService.logicMove(`[gameLogicService] setDirection called with: ${dir}`);
  const uiState = get(uiStateStore);
  const boardState = get(boardStore);
  if (!uiState || !boardState) return;

  const { boardSize } = boardState;
  const { selectedDirection, selectedDistance } = uiState;
  const maxDist = boardSize - 1;
  let newDistance = selectedDistance;

  if (selectedDirection !== dir) {
    newDistance = 1;
  } else {
    newDistance = (!selectedDistance || selectedDistance >= maxDist) ? 1 : selectedDistance + 1;
  }
  
  uiStateStore.update(s => s ? ({ ...s, selectedDirection: dir, selectedDistance: newDistance }) : null);
  
  logService.logicMove('setDirection: встановлено напрямок', { dir, newDistance });
}

export function setDistance(dist: number) {
  logService.logicMove(`[gameLogicService] setDistance called with: ${dist}`);
  uiStateStore.update(s => s ? ({ ...s, selectedDistance: dist }) : null);
}

export function performMove(
  direction: MoveDirectionType,
  distance: number,
  playerIndex: number,
  currentState: any, // Combined state
  settings: any
) {
  logService.logicMove('performMove: початок з параметрами:', { direction, distance, playerIndex });

  const figure = new Figure(currentState.playerRow, currentState.playerCol, currentState.boardSize);
  const newPosition = figure.calculateNewPosition(direction, distance);

  if (!figure.isValidPosition(newPosition.row, newPosition.col)) {
    logService.logicMove('performMove: вихід за межі дошки');
    return { success: false, reason: 'out_of_bounds' };
  }

  if (isCellBlocked(newPosition.row, newPosition.col, currentState.cellVisitCounts, settings)) {
    logService.logicMove('performMove: хід на заблоковану клітинку');
    return { success: false, reason: 'blocked_cell' };
  }

  const scoreChanges = calculateMoveScore(currentState, newPosition, playerIndex, settings, distance, direction);

  const startCellKey = `${currentState.playerRow}-${currentState.playerCol}`;
  const updatedCellVisitCounts = { ...currentState.cellVisitCounts, [startCellKey]: (currentState.cellVisitCounts[startCellKey] || 0) + 1 };
  
  const changes = {
    boardState: {
      playerRow: newPosition.row,
      playerCol: newPosition.col,
      cellVisitCounts: updatedCellVisitCounts,
      moveQueue: [...currentState.moveQueue, { player: playerIndex + 1, direction, distance, to: newPosition }],
      moveHistory: [...currentState.moveHistory, { pos: newPosition, blocked: [], visits: updatedCellVisitCounts, blockModeEnabled: settings.blockModeEnabled, lastMove: { direction, distance, player: playerIndex } }],
    },
    playerState: {
      players: currentState.players.map((p: any, i: number) => i === playerIndex ? { ...p, score: p.score + scoreChanges.baseScoreChange } : p),
    },
    scoreState: {
      penaltyPoints: currentState.penaltyPoints + scoreChanges.penaltyPoints,
      movesInBlockMode: currentState.movesInBlockMode + scoreChanges.movesInBlockModeChange,
      jumpedBlockedCells: currentState.jumpedBlockedCells + scoreChanges.jumpedBlockedCellsChange,
      distanceBonus: (currentState.distanceBonus || 0) + scoreChanges.distanceBonusChange,
    },
    uiState: {
      lastMove: { direction, distance, player: playerIndex }
    }
  };

  logService.logicMove('performMove: завершено успішно');
  return {
    success: true,
    changes,
    newPosition,
    bonusPoints: scoreChanges.bonusPoints,
    penaltyPoints: scoreChanges.penaltyPointsForMove
  };
}