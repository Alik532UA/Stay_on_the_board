/**
 * @file This service is the single entry point for all user-initiated actions.
 * It orchestrates the flow of user intentions to the appropriate services.
 */
import { get } from 'svelte/store';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { gameStore } from '$lib/stores/gameStore';
import { modalService } from './modalService';
import { gameModeService } from './gameModeService';
import { sideEffectService } from './sideEffectService';
import { replayService } from './replayService';
import { stateManager } from './stateManager';
import { gameState } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService.js';
import { settingsStore } from '$lib/stores/settingsStore';
import { getAvailableMoves } from '$lib/utils/boardUtils.ts';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { animationStore } from '$lib/stores/animationStore';

export const userActionService = {
  async confirmMove(): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) gameModeService.initializeGameMode();
    const playerInput = get(playerInputStore);
    if (!playerInput.selectedDirection || !playerInput.selectedDistance) return;
    
    await get(gameStore).mode!.handlePlayerMove(playerInput.selectedDirection, playerInput.selectedDistance);

    if (gameModeService._determineGameType() === 'local') {
      sideEffectService.speakMove(playerInput.selectedDirection, playerInput.selectedDistance);
    }
  },

  async claimNoMoves(): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) gameModeService.initializeGameMode();
    await get(gameStore).mode!.claimNoMoves();
  },

  async changeBoardSize(newSize: number): Promise<void> {
    const { players, penaltyPoints, boardSize } = get(gameState);
    const score = players.reduce((acc, p) => acc + p.score, 0);
    if (newSize === boardSize) return;

    if (score === 0 && penaltyPoints === 0) {
      gameLogicService.resetGame({ newSize }, get(gameState));
    } else {
      modalService.showResetScoreConfirmation(newSize);
    }
  },

  async requestRestart(): Promise<void> {
    await gameModeService.restartGame();
  },

  async requestReplay(): Promise<void> {
    const gameType = gameModeService._determineGameType();
    const modalContext = modalService.getCurrentModalContext();
    replayService.saveReplayData(gameType, modalContext);
    await sideEffectService.navigateToReplay();
  },

  async finishWithBonus(reasonKey: string): Promise<void> {
    await stateManager.applyChanges(
      'SET_FINISH_FLAG',
      { finishedByFinishButton: true },
      'Player chose to finish with a bonus'
    );
    await gameModeService.endGame(reasonKey);
  },

  async continueAfterNoMoves(): Promise<void> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const bonus = state.boardSize;

    const continueChanges = {
      noMovesBonus: state.noMovesBonus + bonus,
      cellVisitCounts: {},
      moveHistory: [{ 
        pos: { row: state.playerRow, col: state.playerCol }, 
        blocked: [] as {row: number, col: number}[], 
        visits: {},
        blockModeEnabled: settings.blockModeEnabled
      }],
      moveQueue: [] as any[],
      availableMoves: getAvailableMoves(
        state.playerRow,
        state.playerCol,
        state.boardSize,
        {},
        settings.blockOnVisitCount,
        state.board,
        settings.blockModeEnabled,
        null
      ),
      noMovesClaimed: false,
      isComputerMoveInProgress: false,
      wasResumed: true,
      isGameOver: false,
      gameOverReasonKey: null as string | null,
      gameOverReasonValues: null as Record<string, any> | null
    };

    await stateManager.applyChanges('CONTINUE_AFTER_NO_MOVES_CLAIM', continueChanges, 'Player continues after successful no-moves claim');
    
    gameOverStore.resetGameOverState();
    animationStore.reset();
    modalService.closeModal();
  }
};