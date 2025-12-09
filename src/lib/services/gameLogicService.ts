// src/lib/services/gameLogicService.ts
import { Piece, type MoveDirectionType } from '../models/Piece';
import { get } from 'svelte/store';
import { isCellBlocked, isMirrorMove } from '$lib/utils/boardUtils';
import { logService } from './logService.js';
import { calculateMoveScore } from './scoreService';
import type { Direction } from '$lib/utils/gameUtils';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { appSettingsStore, type AppSettingsState } from '$lib/stores/appSettingsStore';

export function performMove(
  direction: MoveDirectionType,
  distance: number,
  playerIndex: number,
  currentState: any, // Combined state
  settings: any,
  actualGameMode: 'training' | 'local' | 'timed' | 'online' | 'virtual-player',
  onEndCallback?: () => void
) {
  logService.state('Logical Position (at move start)', { row: currentState.playerRow, col: currentState.playerCol });
  logService.logicMove('performMove: початок з параметрами:', { direction, distance, playerIndex });

  const piece = new Piece(currentState.playerRow, currentState.playerCol, currentState.boardSize);
  const newPosition = piece.calculateNewPosition(direction, distance);

  if (!piece.isValidPosition(newPosition.row, newPosition.col)) {
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

  // ВАЖЛИВО: Згідно документації docs/user-guide/bonus-scoring.md (рядки 88-101),
  // в режимах local/online НЕ нараховуються базові бали (+1/+2/+3 за видимість дошки).
  // Базові бали нараховуються ТІЛЬКИ в режимах training/virtual-player/timed.
  // ВИПРАВЛЕННЯ: Використовуємо actualGameMode (фактичний режим гри з BaseGameMode),
  // а не settings.gameMode (який містить пресет, напр. 'observer', 'beginner').
  const isLocalOrOnlineGame = actualGameMode === 'local' || actualGameMode === 'online';
  const shouldApplyBaseScore = !isLocalOrOnlineGame;
  const baseScoreToAdd = shouldApplyBaseScore ? scoreChanges.baseScoreChange : 0;

  logService.score('[performMove] Score calculation:', {
    actualGameMode,
    presetGameMode: settings.gameMode,
    isLocalOrOnlineGame,
    shouldApplyBaseScore,
    baseScoreChange: scoreChanges.baseScoreChange,
    baseScoreToAdd,
    bonusPoints: scoreChanges.bonusPoints,
    penaltyPoints: scoreChanges.penaltyPointsForMove
  });

  const changes = {
    boardState: {
      playerRow: newPosition.row,
      playerCol: newPosition.col,
      cellVisitCounts: updatedCellVisitCounts,
      moveQueue: [...currentState.moveQueue, { player: playerIndex + 1, direction, distance, to: newPosition }],
      moveHistory: [...currentState.moveHistory, { pos: newPosition, blocked: [], visits: updatedCellVisitCounts, blockModeEnabled: settings.blockModeEnabled, lastMove: { direction, distance, player: playerIndex } }],
    },
    playerState: {
      players: currentState.players.map((p: any, i: number) => i === playerIndex ? { ...p, score: p.score + baseScoreToAdd } : p),
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

  const sideEffects = [];
  const currentPlayer = currentState.players[playerIndex];
  const shouldSpeak = settings.speechEnabled &&
    ((currentPlayer.isComputer && settings.speechFor.computer) ||
      (!currentPlayer.isComputer && settings.speechFor.player));

  // Якщо потрібно озвучити хід, АБО якщо є callback, який потрібно виконати в кінці ходу,
  // ми створюємо побічний ефект. speechService сам вирішить, чи потрібно говорити.
  if (shouldSpeak || onEndCallback) {
    sideEffects.push({
      type: 'speak_move',
      payload: {
        move: { direction, distance },
        lang: (get(appSettingsStore) as AppSettingsState).language || 'uk',
        voiceURI: settings.selectedVoiceURI,
        onEndCallback
      }
    });
  }

  logService.logicMove('performMove: завершено успішно');
  return {
    success: true,
    changes,
    newPosition,
    bonusPoints: scoreChanges.bonusPoints,
    penaltyPoints: scoreChanges.penaltyPointsForMove,
    sideEffects
  };
}