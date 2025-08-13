import type { GameState, Player } from '$lib/stores/gameState';
import { isMirrorMove } from '$lib/utils/boardUtils';
import { logService } from './logService';
import type { FinalScoreDetails } from '$lib/models/score';

export function calculateFinalScore(state: GameState, gameMode: 'local' | 'vs-computer'): FinalScoreDetails {
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
  const finalNoMovesBonus = gameMode === 'local' ? 0 : noMovesBonus || 0;

  const totalScore = baseScore + sizeBonus + blockModeBonus + jumpBonus + (distanceBonus || 0) - totalPenalty + finalNoMovesBonus + finishBonus;

  return {
    baseScore,
    totalPenalty,
    sizeBonus,
    blockModeBonus,
    jumpBonus,
    noMovesBonus: finalNoMovesBonus,
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

export function calculateMoveScore(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  settings: any,
  distance: number = 1,
  direction?: string
): { players: Player[]; penaltyPoints: number; movesInBlockMode: number; jumpedBlockedCells: number; bonusPoints: number; distanceBonus: number; currentJumpedCount: number; penaltyPointsForMove: number; } {
  
  const newPlayers = JSON.parse(JSON.stringify(currentState.players)); // Deep copy
  const currentPlayer = newPlayers[playerIndex];
  const isHumanMove = currentPlayer?.type === 'human';
  let newPenaltyPoints = currentState.penaltyPoints;
  let newMovesInBlockMode = currentState.movesInBlockMode;
  let newJumpedBlockedCells = currentState.jumpedBlockedCells;
  let newBonusPoints = 0;
  let newDistanceBonus = currentState.distanceBonus || 0;
  let penaltyPointsForMove = 0;

  if (isHumanMove) {
    if (!settings.showBoard) {
      currentPlayer.score += 3;
    } else if (!settings.showPiece) {
      currentPlayer.score += 2;
    } else {
      currentPlayer.score += 1;
    }
  }

  const humanPlayersCount = currentState.players.filter((p: any) => p.type === 'human').length;
  
  logService.logic(`calculateMoveScore: humanPlayersCount = ${humanPlayersCount}, playerIndex = ${playerIndex}, isHumanMove = ${isHumanMove}`);
  
  if (isHumanMove && direction && currentState.moveQueue.length >= 1 && !settings.blockModeEnabled) {
    const lastComputerMove = currentState.moveQueue[currentState.moveQueue.length - 1];
    
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

  if (settings.blockModeEnabled) {
    newMovesInBlockMode += 1;
  }

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

  if (distance > 1) {
    newDistanceBonus += 1;
    newBonusPoints += 1;
    logService.score(`calculateMoveScore: додаємо 1 бонусний бал за хід на відстань ${distance}`);
  }

  if (jumpedCount > 0 && settings.blockModeEnabled) {
    newBonusPoints += jumpedCount;
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