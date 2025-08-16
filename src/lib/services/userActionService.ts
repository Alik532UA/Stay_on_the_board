/**
 * @file This service is the single entry point for all user-initiated actions.
 * It orchestrates the flow of user intentions to the appropriate services.
 */
import { get } from 'svelte/store';
import { replayStore } from '$lib/stores/replayStore.js';
import { modalStore } from '$lib/stores/modalStore';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { gameStore } from '$lib/stores/gameStore';
import { modalService } from './modalService';
import { gameModeService } from './gameModeService';
import { sideEffectService, type SideEffect } from './sideEffectService';
import { replayService } from './replayService';
import { logService } from './logService.js';
import { stateManager } from './stateManager';
import { gameState } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService.js';
import { settingsStore } from '$lib/stores/settingsStore';
import { getAvailableMoves } from '$lib/utils/boardUtils.ts';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { animationStore } from '$lib/stores/animationStore';
import { base } from '$app/paths';

export const userActionService = {
  async confirmMove(): Promise<void> {
    let activeGameMode = get(gameStore).mode;
    if (!activeGameMode) {
      gameModeService.initializeGameMode();
      activeGameMode = get(gameStore).mode;
      if (!activeGameMode) {
        logService.logic('[userActionService.confirmMove] No active game mode found after initialization.');
        return;
      }
    }
    const playerInput = get(playerInputStore);
    if (!playerInput.selectedDirection || !playerInput.selectedDistance) return;

    const sideEffects = await activeGameMode.handlePlayerMove(playerInput.selectedDirection, playerInput.selectedDistance);
    logService.logic('[userActionService.confirmMove] Side effects from handlePlayerMove:', sideEffects);
    sideEffects.forEach(effect => sideEffectService.execute(effect));
  },

  async claimNoMoves(): Promise<void> {
    let activeGameMode = get(gameStore).mode;
    if (!activeGameMode) {
      gameModeService.initializeGameMode();
      activeGameMode = get(gameStore).mode;
      if (!activeGameMode) {
        logService.logic('[userActionService.claimNoMoves] No active game mode found after initialization.');
        return;
      }
    }
    const sideEffects = await activeGameMode.claimNoMoves();
    sideEffects.forEach(effect => sideEffectService.execute(effect));
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
    const sideEffects = await gameModeService.restartGame();
    this.executeSideEffects(sideEffects);
  },

  async requestReplay(): Promise<void> {
    modalStore.closeModal();
    const { moveHistory, boardSize } = get(gameState);
    if (moveHistory && moveHistory.length > 0) {
      logService.logic('[userActionService] Starting replay mode');
      replayStore.startReplay(moveHistory, boardSize);
    } else {
      logService.logic('[userActionService] No move history to replay.');
    }
  },

  async finishWithBonus(reasonKey: string): Promise<void> {
    logService.logic('[userActionService] finishWithBonus called with reason:', reasonKey);
    await stateManager.applyChanges(
      'SET_FINISH_FLAG',
      { finishedByFinishButton: true },
      'Player chose to finish with a bonus'
    );
    const sideEffects = await gameModeService.endGame(reasonKey);
    this.executeSideEffects(sideEffects);
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
    this.executeSideEffects([{ type: 'ui/closeModal' }]);
  },

  async handleModalAction(action: string, payload?: any): Promise<void> {
    let sideEffects: SideEffect[] = [];
    switch (action) {
      case 'restartGame':
        await this.requestRestart();
        break;
      case 'requestReplay':
        await this.requestReplay();
        break;
      case 'finishWithBonus':
        await this.finishWithBonus(payload.reasonKey);
        break;
      case 'continueAfterNoMoves':
        await this.continueAfterNoMoves();
        break;
      case 'resetGame':
        gameLogicService.resetGame({ newSize: payload.newSize }, get(gameState));
        sideEffects = [{ type: 'ui/closeModal' }];
        break;
      case 'closeModal':
        sideEffects = [{ type: 'ui/closeModal' }];
        break;
      default:
        logService.logic(`[userActionService.handleModalAction] Unknown action: ${action}`);
        break;
    }
    this.executeSideEffects(sideEffects);
  },

  executeSideEffects(sideEffects: SideEffect[]) {
    sideEffects.forEach(effect => sideEffectService.execute(effect));
  }
};