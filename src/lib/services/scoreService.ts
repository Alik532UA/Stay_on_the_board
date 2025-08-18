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


function _calculateBaseScore(player: Player, settings: any): number {
  if (player?.type !== 'human') {
    return 0;
  }
  if (!settings.showBoard) {
    return 3;
  }
  if (!settings.showPiece) {
    return 2;
  }
  return 1;
}

function _calculateMirrorMovePenalty(currentState: any, direction: string, distance: number, settings: any): { penaltyPoints: number; penaltyPointsForMove: number } {
  let penaltyPoints = 0;
  let penaltyPointsForMove = 0;
  const humanPlayersCount = currentState.players.filter((p: any) => p.type === 'human').length;
  const lastComputerMove = currentState.moveQueue[currentState.moveQueue.length - 1];

  if (direction && lastComputerMove && lastComputerMove.player !== 0 && !settings.blockModeEnabled) {
    const isMirror = isMirrorMove(direction, distance, lastComputerMove.direction, lastComputerMove.distance);
    logService.logic(`_calculateMirrorMovePenalty: перевіряємо "дзеркальний" хід:`, {
      currentMove: { direction, distance },
      computerMove: { direction: lastComputerMove.direction, distance: lastComputerMove.distance },
      isMirrorMove: isMirror
    });

    if (isMirror) {
      if (humanPlayersCount <= 1) {
        logService.score(`_calculateMirrorMovePenalty: додаємо 2 штрафних бали до загального penaltyPoints (single player game)`);
        penaltyPoints = 2;
      } else {
        logService.score(`_calculateMirrorMovePenalty: НЕ додаємо штрафні бали до загального penaltyPoints (local game), будуть додані до гравця в performMove`);
        penaltyPointsForMove = 2;
      }
    }
  } else {
    logService.logic(`_calculateMirrorMovePenalty: пропускаємо перевірку "дзеркального" ходу.`);
  }

  return { penaltyPoints, penaltyPointsForMove };
}

function _calculateDistanceBonus(distance: number): { bonus: number; distanceBonusChange: number } {
  if (distance > 1) {
    logService.score(`_calculateDistanceBonus: додаємо 1 бонусний бал за хід на відстань ${distance}`);
    return { bonus: 1, distanceBonusChange: 1 };
  }
  return { bonus: 0, distanceBonusChange: 0 };
}

function _calculateJumpBonus(jumpedCount: number, settings: any): number {
  if (jumpedCount > 0 && settings.blockModeEnabled) {
    logService.score(`_calculateJumpBonus: додаємо ${jumpedCount} бонусних балів за перестрибування ${jumpedCount} заблокованих клітинок`);
    return jumpedCount;
  }
  if (jumpedCount > 0 && !settings.blockModeEnabled) {
    logService.score(`_calculateJumpBonus: пропускаємо бонуси за перестрибування (blockModeEnabled = false)`);
  }
  return 0;
}

export function calculateMoveScore(
  currentState: any,
  newPosition: { row: number; col: number },
  playerIndex: number,
  settings: any,
  distance: number = 1,
  direction?: string
): {
  baseScoreChange: number;
  penaltyPoints: number;
  movesInBlockModeChange: number;
  jumpedBlockedCellsChange: number;
  bonusPoints: number;
  distanceBonusChange: number;
  penaltyPointsForMove: number;
} {
  
  const originalPlayer = currentState.players[playerIndex];
  const isHumanMove = originalPlayer?.type === 'human';

  const baseScoreChange = _calculateBaseScore(originalPlayer, settings);
  
  let penaltyResult = { penaltyPoints: 0, penaltyPointsForMove: 0 };
  if (isHumanMove) {
    penaltyResult = _calculateMirrorMovePenalty(currentState, direction!, distance, settings);
  }
  
  const jumpedCount = 0;

  const distanceBonusResult = _calculateDistanceBonus(distance);
  const jumpBonus = _calculateJumpBonus(jumpedCount, settings);
  const totalBonusPoints = distanceBonusResult.bonus + jumpBonus;

  const movesInBlockModeChange = settings.blockModeEnabled ? 1 : 0;

  return {
    baseScoreChange: baseScoreChange,
    penaltyPoints: penaltyResult.penaltyPoints,
    movesInBlockModeChange: movesInBlockModeChange,
    jumpedBlockedCellsChange: jumpedCount,
    bonusPoints: totalBonusPoints,
    distanceBonusChange: distanceBonusResult.distanceBonusChange,
    penaltyPointsForMove: penaltyResult.penaltyPointsForMove
  };
}

export function validateScoreUpdate(changes: any, currentState: any): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (changes.scores !== undefined) {
    if (!Array.isArray(changes.scores)) {
      errors.push('scores must be an array');
    } else if (changes.scores.length !== currentState.players.length) {
      errors.push('scores array length must match players count');
    } else {
      for (let i = 0; i < changes.scores.length; i++) {
        if (typeof changes.scores[i] !== 'number') {
          errors.push(`score[${i}] must be a number`);
        }
      }
    }
  }

  return { errors, warnings };
}
export function determineWinner(state: GameState, reasonKey: string): { winners: number[], winningPlayerIndex: number } {
  const scores = state.scoresAtRoundStart;

  const isNoMovesSurrender = reasonKey === 'modal.gameOverReasonNoMovesLeft';
  const losingPlayerIndex = isNoMovesSurrender ? -1 : state.currentPlayerIndex;

  let maxScore = -Infinity;
  for (let i = 0; i < scores.length; i++) {
    if (i !== losingPlayerIndex) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
      }
    }
  }

  const winners: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    if (i !== losingPlayerIndex && scores[i] === maxScore) {
      winners.push(i);
    }
  }
  
  const winningPlayerIndex = winners.length > 0 ? winners[0] : -1;
  return { winners, winningPlayerIndex };
}