// src/lib/services/noMovesService.ts
import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { gameEventBus } from './gameEventBus';
import { calculateFinalScore } from './scoreService';
import { endGameService } from './endGameService';
import { availableMovesService } from './availableMovesService';

export const noMovesService = {
  async claimNoMoves(): Promise<void> {
    const state = get(gameState);
    if (!state) return;

    const availableMoves = availableMovesService.getAvailableMoves();

    if (availableMoves.length > 0) {
      const currentPlayerName = state.players[state.currentPlayerIndex].name;
      await endGameService.endGame('modal.gameOverReasonPlayerLied', { playerName: currentPlayerName });
    } else {
      this.dispatchNoMovesEvent('human');
    }
  },

  dispatchNoMovesEvent(playerType: 'human' | 'computer') {
    const state = get(gameState);
    if (!state) return;

    const scoreDetails = calculateFinalScore(state, 'vs-computer');
    gameEventBus.dispatch('ShowNoMovesModal', {
      playerType,
      scoreDetails,
      boardSize: state.boardSize
    });
  }
};