import { get } from 'svelte/store';
import { testModeStore } from '$lib/stores/testModeStore';
import { logService } from './logService';
import { availableMovesService } from './availableMovesService';
import type { MoveDirectionType } from '../models/Figure';

class AiService {
  public getComputerMove(): { direction: MoveDirectionType; distance: number } | null {
    const testModeState = get(testModeStore);
    logService.testMode('aiService: отримано стан testModeStore', testModeState);

    if (testModeState.computerMoveMode === 'manual' && testModeState.manualComputerMove.direction && testModeState.manualComputerMove.distance) {
      logService.testMode('aiService: виконується ручний хід', testModeState.manualComputerMove);
      return {
        direction: testModeState.manualComputerMove.direction as MoveDirectionType,
        distance: testModeState.manualComputerMove.distance
      };
    }

    logService.testMode('aiService: виконується випадковий хід');
    const availableMoves = availableMovesService.getAvailableMoves();

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