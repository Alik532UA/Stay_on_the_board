/**
 * @file This service is the single entry point for all user-initiated actions.
 * It orchestrates the flow of user intentions to the appropriate services.
 */
import { get } from 'svelte/store';
import { tick } from 'svelte';
import { replayStore } from '$lib/stores/replayStore.js';
import { modalStore } from '$lib/stores/modalStore';
import { gameStore } from '$lib/stores/gameStore';
import { modalService } from './modalService';
import { gameModeService } from './gameModeService';
import { sideEffectService, type SideEffect } from './sideEffectService';
import { gameEventBus } from './gameEventBus';
import { replayService } from './replayService';
import { logService } from './logService.js';
import { gameState } from '$lib/stores/gameState';
import ReplayViewer from '$lib/components/ReplayViewer.svelte';
import * as gameLogicService from '$lib/services/gameLogicService.js';
import { navigationService } from './navigationService';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { animationStore } from '$lib/stores/animationStore';
import { base } from '$app/paths';
import { endGameService } from './endGameService';

export const userActionService = {
  async confirmMove(direction: string, distance: number): Promise<void> {
    if (get(gameState)?.isComputerMoveInProgress) {
      return;
    }
    // gameStateMutator.applyMove({ isComputerMoveInProgress: true });
    try {
      logService.logicMove('[userActionService] Input locked: isComputerMoveInProgress=true');
      let activeGameMode = get(gameStore).mode;
      if (!activeGameMode) {
        gameModeService.initializeGameMode();
        activeGameMode = get(gameStore).mode;
        if (!activeGameMode) {
          logService.logicMove('[userActionService.confirmMove] No active game mode found after initialization.');
          return;
        }
      }

      await activeGameMode.handlePlayerMove(direction, distance);
    } finally {
      // НАВІЩО: Гарантуємо, що всі оновлення DOM (наприклад, закриття модального вікна)
      // завершаться перед тим, як розблокувати ввід для наступних дій.
      // Це усуває стан гонитви (race condition).
      await tick();
      logService.logicMove('[userActionService] Input unlocked: isMoveInProgress=false');
      // gameStateMutator.applyMove({ isComputerMoveInProgress: false });
    }
  },

  async claimNoMoves(): Promise<void> {
    if (get(gameState)?.isComputerMoveInProgress) {
      return;
    }
    // gameStateMutator.applyMove({ isComputerMoveInProgress: true });
    try {
      logService.logicMove('[userActionService] Input locked: isComputerMoveInProgress=true');
      let activeGameMode = get(gameStore).mode;
      if (!activeGameMode) {
        gameModeService.initializeGameMode();
        activeGameMode = get(gameStore).mode;
        if (!activeGameMode) {
          logService.logicMove('[userActionService.claimNoMoves] No active game mode found after initialization.');
          return;
        }
      }
      await activeGameMode.claimNoMoves();
    } finally {
      // НАВІЩО: Гарантуємо, що всі оновлення DOM (наприклад, закриття модального вікна)
      // завершаться перед тим, як розблокувати ввід для наступних дій.
      // Це усуває стан гонитви (race condition).
      await tick();
      logService.logicMove('[userActionService] Input unlocked: isMoveInProgress=false');
      // gameStateMutator.applyMove({ isComputerMoveInProgress: false });
    }
  },

  async changeBoardSize(newSize: number): Promise<void> {
    const { players, penaltyPoints, boardSize } = get(gameState);
    const score = players.reduce((acc, p) => acc + p.score, 0);
    if (newSize === boardSize) return;

    if (score === 0 && penaltyPoints === 0) {
      gameLogicService.resetGame({ newSize }, get(gameState));
    } else {
      modalService.showBoardResizeModal(newSize);
    }
  },

  async requestRestart(): Promise<void> {
    modalStore.closeModal();
    await gameModeService.restartGame();
  },

  async requestReplay(): Promise<void> {
    const { moveHistory, boardSize } = get(gameState);
    modalStore.showModal({
      component: ReplayViewer,
      props: {
        moveHistory,
        boardSize,
      },
      titleKey: 'replay.title',
      buttons: [{ textKey: 'modal.close', onClick: () => modalStore.closeModal() }],
      dataTestId: 'replay-modal',
    });
  },

  async finishWithBonus(reasonKey: string): Promise<void> {
    logService.logicMove('[userActionService] finishWithBonus called with reason:', reasonKey);
    gameState.update(state => ({...state, finishedByFinishButton: true}));
    await endGameService.endGame(reasonKey);
  },

  async continueAfterNoMoves(): Promise<void> {
    await gameModeService.continueAfterNoMoves();
  },

  async handleModalAction(action: string, payload?: any): Promise<void> {
    if (get(gameState)?.isComputerMoveInProgress) {
      return;
    }
    // gameStateMutator.applyMove({ isComputerMoveInProgress: true });
    try {
      logService.logicMove('[userActionService] Input locked: isComputerMoveInProgress=true');
      switch (action) {
        case 'restartGame':
          await this.requestRestart();
          break;
        case 'playAgain':
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
          gameEventBus.dispatch('CloseModal');
          break;
        case 'closeModal':
          gameEventBus.dispatch('CloseModal');
          break;
        default:
          logService.logicMove(`[userActionService.handleModalAction] Unknown action: ${action}`);
          break;
      }
    } finally {
      // НАВІЩО: Гарантуємо, що всі оновлення DOM (наприклад, закриття модального вікна)
      // завершаться перед тим, як розблокувати ввід для наступних дій.
      // Це усуває стан гонитви (race condition).
      await tick();
      logService.logicMove('[userActionService] Input unlocked: isMoveInProgress=false');
      // gameStateMutator.applyMove({ isComputerMoveInProgress: false });
    }
  },

};