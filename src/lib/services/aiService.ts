// src/lib/services/aiService.ts
import { get } from 'svelte/store';
import { gameState, type GameState } from '$lib/stores/gameState';
import { logService } from './logService';
import { availableMovesService } from './availableMovesService';
import type { MoveDirectionType } from '../models/Figure';

class AiService {
  public getComputerMove(state: GameState | null = get(gameState)): { direction: MoveDirectionType; distance: number } | null {
    if (!state) return null;

    logService.testMode('aiService: отримано стан gameState', state);

    if (state.testModeOverrides?.nextComputerMove) {
      logService.testMode('aiService: виконується ручний хід з gameState overrides', state.testModeOverrides.nextComputerMove);
      return state.testModeOverrides.nextComputerMove;
    }

    logService.testMode('aiService: виконується випадковий хід');
    const availableMoves = availableMovesService.getAvailableMoves(state);

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
}

export const aiService = new AiService();