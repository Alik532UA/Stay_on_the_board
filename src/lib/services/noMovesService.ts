// src/lib/services/noMovesService.ts
import { logService } from './logService';
import { get } from 'svelte/store';
import { gameEventBus } from './gameEventBus';
import { calculateFinalScore } from './scoreService';
import { endGameService } from './endGameService';
import { availableMovesService } from './availableMovesService';
import { gameStore } from '$lib/stores/gameStore';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { uiStateStore } from '$lib/stores/uiStateStore';

export const noMovesService = {
  async claimNoMoves(): Promise<void> {
    const playerState = get(playerStore);
    if (!playerState) return;

    const availableMoves = availableMovesService.getAvailableMoves();

    if (availableMoves.length > 0) {
      const currentPlayerName = playerState.players[playerState.currentPlayerIndex].name;
      await endGameService.endGame('modal.gameOverReasonPlayerLied', { playerName: currentPlayerName });
    } else {
      this.dispatchNoMovesEvent('human');
    }
  },

  dispatchNoMovesEvent(playerType: 'human' | 'computer') {
    logService.GAME_MODE('[noMovesService] dispatchNoMovesEvent called', { playerType });
    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);
    const uiState = get(uiStateStore);
    if (!boardState || !playerState || !scoreState || !uiState) return;

    const scoreDetails = calculateFinalScore(boardState, playerState, scoreState, uiState, 'training');
    gameEventBus.dispatch('ShowNoMovesModal', {
      playerType,
      scoreDetails,
      boardSize: boardState.boardSize
    });
    const gameMode = get(gameStore).mode;
    if (gameMode) {
      gameMode.pauseTimers();
    }
  }
};
