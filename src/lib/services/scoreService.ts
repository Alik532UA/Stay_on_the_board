// src/lib/services/scoreService.ts
import type { Player } from '$lib/models/player';
import { isMirrorMove } from '$lib/utils/boardUtils';
import { logService } from './logService';
import type { FinalScoreDetails } from '$lib/models/score';
import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { ScoreState } from '$lib/stores/scoreStore';
import type { UiState } from '$lib/stores/uiStateStore';

export function calculateFinalScore(
  boardState: BoardState, 
  playerState: PlayerState, 
  scoreState: ScoreState, 
  uiState: UiState,
  gameMode: 'local' | 'training'
): FinalScoreDetails {
  const { players } = playerState;
  const { penaltyPoints, movesInBlockMode, jumpedBlockedCells, noMovesBonus, distanceBonus } = scoreState;
  const { boardSize } = boardState;

  const baseScore = players.reduce((acc: number, p: Player) => acc + p.score, 0);
  const totalPenalty = penaltyPoints;
  let sizeBonus = 0;
  if (baseScore > 0) {
    const percent = (boardSize * boardSize) / 100;
    sizeBonus = Math.round(baseScore * percent);
  }
  const blockModeBonus = movesInBlockMode;
  const finishBonus = uiState.gameOverReasonKey === 'modal.gameOverReasonBonus' ? boardSize : 0;
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
  const lastComputerMove = currentState.lastMove;

  if (direction && lastComputerMove && lastComputerMove.player !== 0 && !settings.blockModeEnabled) {
    const isMirror = isMirrorMove(direction, distance, lastComputerMove.direction, lastComputerMove.distance);
    if (isMirror) {
      if (humanPlayersCount <= 1) {
        penaltyPoints = 2;
      } else {
        penaltyPointsForMove = 2;
      }
    }
  }
  return { penaltyPoints, penaltyPointsForMove };
}

function _calculateDistanceBonus(distance: number): { bonus: number; distanceBonusChange: number } {
  if (distance > 1) {
    return { bonus: 1, distanceBonusChange: 1 };
  }
  return { bonus: 0, distanceBonusChange: 0 };
}

function _calculateJumpBonus(jumpedCount: number, settings: any): number {
  if (jumpedCount > 0 && settings.blockModeEnabled) {
    return jumpedCount;
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
  if (isHumanMove && direction) {
    penaltyResult = _calculateMirrorMovePenalty(currentState, direction, distance, settings);
  }
  
  const jumpedCount = 0; // TODO: Implement jump calculation

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

export function determineWinner(playerState: PlayerState, reasonKey: string, losingPlayerIndex: number | null = null): { winners: number[], winningPlayerIndex: number } {
  logService.GAME_MODE('[scoreService] determineWinner called', { losingPlayerIndex });
  const scores = playerState.players.map(p => p.score);
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
      winners.push(playerState.players[i].id);
    }
  }
  
  const winningPlayerIndex = winners.length > 0 ? playerState.players.findIndex(p => p.id === winners[0]) : -1;
  return { winners, winningPlayerIndex };
}