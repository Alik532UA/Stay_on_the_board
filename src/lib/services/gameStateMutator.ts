// file: src/lib/services/gameStateMutator.ts
import { gameState, type GameState, createInitialState } from '$lib/stores/gameState';
import { logService } from './logService';
import { get } from 'svelte/store';
import { settingsStore } from '$lib/stores/settingsStore';

class GameStateMutator {
  
  public resetGame(options: { newSize?: number; players?: any[] } = {}) {
    logService.state('[GameStateMutator] Resetting game state', options);
    const newSize = options.newSize ?? get(gameState)?.boardSize ?? 4;
    
    // Отримуємо статус тестового режиму з налаштувань
    const isTestMode = get(settingsStore).testMode;
    logService.testMode(`[GameStateMutator] Test mode is ${isTestMode ? 'ON' : 'OFF'}`);

    const newState = createInitialState({
      size: newSize,
      players: options.players,
      testMode: isTestMode // Передаємо статус в конфігурацію
    });
    gameState.set(newState);
  }

  public applyMove(changes: Partial<GameState>) {
    logService.state('[GameStateMutator] Applying move', changes);
    gameState.update(state => {
      if (!state) return null;
      return { ...state, ...changes };
    });
  }
  
  public setCurrentPlayer(playerIndex: number) {
    logService.state('[GameStateMutator] Setting current player', playerIndex);
    gameState.update(state => {
      if (!state) return null;
      return { ...state, currentPlayerIndex: playerIndex };
    });
  }

  public setGameOver(reasonKey: string, reasonValues: Record<string, any> | null = null) {
    logService.state('[GameStateMutator] Setting game over', { reasonKey, reasonValues });
    gameState.update(state => {
      if (!state) return null;
      return {
        ...state,
        isGameOver: true,
        gameOverReasonKey: reasonKey,
        gameOverReasonValues: reasonValues,
      };
    });
  }
  
  public clearCellVisits() {
    logService.state('[GameStateMutator] Clearing cell visits');
    gameState.update(state => {
      if (!state) return null;
      return { ...state, cellVisitCounts: {} };
    });
  }
}

export const gameStateMutator = new GameStateMutator();