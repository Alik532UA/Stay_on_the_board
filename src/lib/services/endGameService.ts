// src/lib/services/endGameService.ts
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameStateMutator } from './gameStateMutator';
import { calculateFinalScore, determineWinner } from './scoreService';
import { gameEventBus } from './gameEventBus';
import { logService } from './logService';

export const endGameService = {
  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    logService.GAME_MODE(`[endGameService] endGame called with reason:`, reasonKey);
    const state = get(gameState);
    if (!state) return;

    const humanPlayersCount = state.players.filter(p => p.type === 'human').length;
    const gameType = humanPlayersCount > 1 ? 'local' : 'vs-computer';
    const finalScoreDetails = calculateFinalScore(state, gameType);

    gameStateMutator.setGameOver(reasonKey, reasonValues);

    const { winners } = determineWinner(state, reasonKey);
    gameOverStore.setGameOver({
      scores: state.players.map(p => ({ playerId: p.id, score: p.score })),
      winners: winners,
      reasonKey,
      reasonValues,
      finalScoreDetails,
      gameType: gameType,
    });

    gameEventBus.dispatch('GameOver', {
      reasonKey,
      reasonValues,
      finalScoreDetails,
      gameType,
      state
    });
  }
};