// src/lib/services/gameInitializationService.ts
import { get } from 'svelte/store';
import { gameState, createInitialState, type GameState } from '$lib/stores/gameState';
import { settingsStore } from '$lib/stores/settingsStore';
import { availableMovesService } from './availableMovesService';
import { logService } from './logService';

class GameInitializationService {
  public initializeNewGame(options: { newSize?: number; players?: any[], settings?: any } = {}) {
    logService.state('[GameInitializationService] Initializing new game', options);

    const settings = options.settings ?? get(settingsStore);
    const isTestMode = settings.testMode;

    const initialState = createInitialState({
      size: options.newSize ?? get(gameState)?.boardSize ?? 4,
      players: options.players,
      testMode: isTestMode,
    });

    const moves = availableMovesService.getAvailableMoves(initialState);
    initialState.availableMoves = moves;

    gameState.set(initialState);
    settingsStore.updateSettings({ showBoard: true, showPiece: true, showMoves: true });
  }
}

export const gameInitializationService = new GameInitializationService();