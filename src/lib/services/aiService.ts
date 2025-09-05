// src/lib/services/aiService.ts
import { get } from 'svelte/store';
import { logService } from './logService';
import { calculateAvailableMoves } from './availableMovesService';
import type { MoveDirectionType } from '../models/Piece';
import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { UiState } from '$lib/stores/uiStateStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';

class AiService {
  public getComputerMove(
    boardState: BoardState, 
    playerState: PlayerState, 
    uiState: UiState
  ): { direction: MoveDirectionType; distance: number } | null {
    if (!boardState || !playerState || !uiState) return null;

    logService.testMode('aiService: отримано стан', { boardState, playerState, uiState });

    if (uiState.testModeOverrides?.nextComputerMove) {
      logService.testMode('aiService: виконується ручний хід з testModeOverrides', uiState.testModeOverrides.nextComputerMove);
      return uiState.testModeOverrides.nextComputerMove;
    }

    logService.testMode('aiService: виконується випадковий хід');
    const availableMoves = calculateAvailableMoves(boardState, playerState, get(gameSettingsStore));

    if (availableMoves.length === 0) {
      logService.logicVirtualPlayer('getComputerMove: немає доступних ходів');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    const randomMove = availableMoves[randomIndex];
    
    logService.logicVirtualPlayer('getComputerMove: знайдено доступні ходи', availableMoves);
    logService.logicVirtualPlayer('getComputerMove: обрано випадковий хід', randomMove);
    
    return randomMove;
  }
}

export const aiService = new AiService();