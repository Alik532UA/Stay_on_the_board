/**
 * @file Encapsulates all logic related to creating, displaying,
 * and managing modal windows.
 */
import { get } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';
import { userActionService } from './userActionService';
import { _, locale } from 'svelte-i18n';
import type { FinalScoreDetails } from '$lib/models/score';
import type { GameState } from '$lib/stores/gameState';
import { determineWinner } from './scoreService';
import { logService } from './logService.js';
import { navigationService } from './navigationService.js';

import { gameModeService } from './gameModeService';

export const modalService = {
  showModal(modalConfig: any): void {
    const gameMode = gameModeService.getCurrentMode();
    if (gameMode) {
      gameMode.pauseTimers();
    }
    modalStore.showModal(modalConfig);
  },

  showBoardResizeModal(newSize: number): void {
    this.showModal({
      titleKey: 'modal.resetScoreTitle',
      contentKey: 'modal.resetScoreContent',
      buttons: [
        {
          textKey: 'modal.confirm',
          onClick: () => userActionService.handleModalAction('resetGame', { newSize }),
          customClass: 'danger-btn',
          isHot: true,
        },
        {
          textKey: 'modal.cancel',
          onClick: () => userActionService.handleModalAction('closeModal'),
        },
      ],
      closable: true,
      closeOnOverlayClick: true,
      dataTestId: 'board-resize-confirm-modal',
    });
  },

  /**
   * Closes the currently active modal.
   */
  closeModal(): void {
    const gameMode = gameModeService.getCurrentMode();
    if (gameMode) {
      gameMode.resumeTimers();
    }
    modalStore.closeModal();
  },

  showGameOverModal(payload: {
    reasonKey: string;
    reasonValues: any;
    finalScoreDetails: FinalScoreDetails;
    gameType: 'vs-computer' | 'local';
    state: GameState;
  }): void {
    const { reasonKey, reasonValues, finalScoreDetails, gameType, state } = payload;
    const t = get(_);
    const { winners } = determineWinner(state, reasonKey);

    let titleKey = 'modal.gameOverTitle';
    if (winners.length === 1) {
      const winner = state.players.find(p => p.id === winners[0]);
      if (winner) {
        titleKey = gameType === 'local' ? 'modal.winnerTitle' : 'modal.gameOverTitle';
      }
    } else if (winners.length > 1) {
      titleKey = 'modal.drawTitle';
    }

    modalStore.showModalAsReplacement({
      titleKey,
      titleValues: {
        winnerName: state.players.find(p => p.id === winners[0])?.name || ''
      },
      content: {
        reason: t(reasonKey, { values: reasonValues }),
        scoreDetails: finalScoreDetails,
      },
      buttons: [
        {
          textKey: 'modal.playAgain',
          onClick: () => userActionService.handleModalAction('playAgain'),
          isHot: true,
          customClass: 'green-btn',
          dataTestId: 'play-again-btn',
        },
        {
          textKey: 'modal.watchReplay',
          onClick: () => userActionService.handleModalAction('requestReplay'),
          customClass: 'blue-btn',
          dataTestId: 'watch-replay-btn',
        },
        {
          textKey: 'modal.mainMenu',
          onClick: () => navigationService.goToMainMenu(),
          dataTestId: 'game-over-main-menu-btn',
        },
      ],
      closable: false,
      dataTestId: 'game-over-modal',
    });
  },

  /**
   * Gets the current context of the modal for serialization.
   * @returns The serializable modal context or null if the modal is not open.
   */
  getCurrentModalContext() {
    const modalState = get(modalStore);
    if (!modalState.isOpen) return null;

    const serializableButtons = modalState.buttons.map(btn => {
      let action = null;
      if (btn.onClick) {
        const onClickString = btn.onClick.toString();
        if (onClickString.includes('continueAfterNoMoves')) action = 'continueAfterNoMoves';
        else if (onClickString.includes('finishWithBonus')) action = 'finishWithBonus';
        else if (onClickString.includes('startReplay')) action = 'startReplay';
        else if (onClickString.includes('restartGame')) action = 'playAgain';
      }
      return {
        textKey: btn.textKey,
        text: btn.text,
        customClass: btn.customClass,
        isHot: btn.isHot,
        action: action,
        bonus: (btn as any).bonus
      };
    });

    return {
      titleKey: modalState.titleKey,
      content: modalState.content,
      buttons: serializableButtons,
      closable: modalState.closable
    };
  }
};