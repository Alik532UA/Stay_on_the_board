/**
 * @file Centralized service for all gameState mutations.
 * This is the single place where `gameState.update()` should be called,
 * ensuring a predictable and debuggable state management flow.
 */
import { gameState, type GameState, createInitialState } from '$lib/stores/gameState';
import { logService } from './logService';
import { get } from 'svelte/store';

class GameStateMutator {
  
  public resetGame(options: { newSize?: number; players?: any[] } = {}) {
    logService.state('[GameStateMutator] Resetting game state', options);
    const newSize = options.newSize ?? get(gameState)?.boardSize ?? 4;
    const newState = createInitialState({
      size: newSize,
      players: options.players,
    });
    gameState.set(newState);
  }

  public applyMove(changes: Partial<GameState>) {
    logService.state('[GameStateMutator] Applying move', changes);
    gameState.update(state => ({ ...state, ...changes }));
  }
  
  public setCurrentPlayer(playerIndex: number) {
    logService.state('[GameStateMutator] Setting current player', playerIndex);
    gameState.update(state => ({ ...state, currentPlayerIndex: playerIndex }));
  }

  public setGameOver(reasonKey: string, reasonValues: Record<string, any> | null = null) {
    logService.state('[GameStateMutator] Setting game over', { reasonKey, reasonValues });
    gameState.update(state => ({
      ...state,
      isGameOver: true,
      gameOverReasonKey: reasonKey,
      gameOverReasonValues: reasonValues,
    }));
  }
  
  public clearCellVisits() {
    logService.state('[GameStateMutator] Clearing cell visits');
    gameState.update(state => ({ ...state, cellVisitCounts: {} }));
  }
}

export const gameStateMutator = new GameStateMutator();