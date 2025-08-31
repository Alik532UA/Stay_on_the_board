// src/lib/services/modalService.ts
import { get } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';
import { userActionService } from './userActionService';
import { _, locale } from 'svelte-i18n';
import type { FinalScoreDetails } from '$lib/models/score';
import { determineWinner } from './scoreService';
import { logService } from './logService.js';
import { navigationService } from './navigationService.js';
import { gameModeService } from './gameModeService';
import type { Player } from '$lib/models/player';
import { gameEventBus } from './gameEventBus';
import type { ModalState } from '$lib/stores/modalStore'; // Import ModalState

// Define the interface for the GameOver event payload
interface GameOverPayload {
  scores: { playerId: number; score: number }[];
  winners: number[];
  reasonKey: string;
  reasonValues: any;
  finalScoreDetails: FinalScoreDetails;
  gameType: 'training' | 'local';
  state: any;
}

// Define the interface for ShowNoMovesModal payload
interface ShowNoMovesModalPayload {
  boardSize: number;
  scoreDetails: FinalScoreDetails;
  playerType: 'human' | 'computer';
}

// Define the interface for ShowBoardResizeModal payload
interface ShowBoardResizeModalPayload {
  newSize: number;
}

export const modalService = {
  showModal(modalConfig: any): void {
    logService.modal('[ModalService] Showing modal:', modalConfig);
    const gameMode = gameModeService.getCurrentMode();
    if (gameMode) {
      gameMode.pauseTimers();
    }
    modalStore.showModal(modalConfig);
  },

  closeModal(): void {
    logService.modal('[ModalService] Closing modal.');
    modalStore.closeModal();
  },

  showGameOverModal(payload: GameOverPayload): void {
    const { reasonKey, reasonValues, finalScoreDetails, gameType, state, winners } = payload;
    const t = get(_);

    let titleKey = 'modal.gameOverTitle';
    if (gameType === 'training') {
      titleKey = 'modal.trainingOverTitle';
    } else if (winners.length === 1) {
      const winner = state.players.find((p: Player) => p.id === winners[0]);
      if (winner) {
        titleKey = gameType === 'local' ? 'modal.winnerTitle' : 'modal.gameOverTitle';
      }
    } else if (winners.length > 1) {
      titleKey = 'modal.drawTitle';
    }

    modalStore.showModalAsReplacement({
      titleKey,
      titleValues: {
        winnerName: state.players.find((p: Player) => p.id === winners[0])?.name || ''
      },
      content: {
        reason: t(reasonKey, { values: reasonValues }),
        scoreDetails: finalScoreDetails,
        playerScores: gameType === 'local' ? state.players.map((p: Player) => ({
          playerName: p.name,
          score: p.score,
          isWinner: winners.includes(p.id),
          isLoser: !winners.includes(p.id) && p.type === 'human'
        })) : []
      },
      buttons: [
        { textKey: 'modal.playAgain', primary: true, isHot: true, onClick: () => userActionService.requestRestart(), dataTestId: 'play-again-btn' },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => userActionService.handleModalAction('requestReplay'), dataTestId: 'watch-replay-btn' },
        { textKey: 'modal.mainMenu', onClick: () => navigationService.goToMainMenu(), dataTestId: 'game-over-main-menu-btn' }
      ],
      dataTestId: 'game-over-modal',
      closeOnOverlayClick: false
    });
  },

  showBoardResizeModal(newSize: number): void {
    this.showModal({
      titleKey: 'modal.resetScoreTitle',
      contentKey: 'modal.resetScoreContent',
      buttons: [
        {
          textKey: 'modal.confirm',
          onClick: () => userActionService.requestRestartWithSize(newSize),
          customClass: 'danger-btn',
          isHot: true,
        },
        {
          textKey: 'modal.cancel',
          onClick: () => this.closeModal(),
        },
      ],
      closable: true,
      closeOnOverlayClick: true,
      dataTestId: 'board-resize-confirm-modal',
    });
  },

  getCurrentModalContext() {
    const modalState: ModalState = get(modalStore); // Explicitly type modalState
    if (!modalState.isOpen) return null;

    return {
      title: modalState.title,
      titleKey: modalState.titleKey,
      content: modalState.content,
      contentKey: modalState.contentKey,
      buttons: modalState.buttons,
      component: modalState.component,
      props: modalState.props,
      closable: modalState.closable,
      closeOnOverlayClick: modalState.closeOnOverlayClick,
      dataTestId: modalState.dataTestId,
      titleValues: modalState.titleValues,
    };
  }
};

// Event listeners
gameEventBus.subscribe('ShowNoMovesModal', (payload: ShowNoMovesModalPayload) => {
  const { playerType, scoreDetails, boardSize } = payload;
  const t = get(_);
  const titleKey = playerType === 'human' ? 'modal.playerNoMovesTitle' : 'modal.computerNoMovesTitle';
  const contentKey = playerType === 'human' ? 'modal.playerNoMovesContent' : 'modal.computerNoMovesContent';

  modalStore.showModal({
    titleKey,
    content: {
      reason: t(contentKey),
      scoreDetails: scoreDetails
    },
    buttons: [
      { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: () => userActionService.handleModalAction('continueAfterNoMoves'), dataTestId: 'continue-game-no-moves-btn' },
      {
        text: t('modal.finishGameWithBonus', { values: { bonus: boardSize } }),
        onClick: () => userActionService.handleModalAction('finishWithBonus', { reasonKey: 'modal.gameOverReasonBonus' }),
        dataTestId: 'finish-game-with-bonus-btn'
      },
      { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => userActionService.handleModalAction('requestReplay'), dataTestId: `watch-replay-${playerType}-no-moves-btn` }
    ],
    closable: false,
    dataTestId: playerType === 'human' ? 'player-no-moves-modal' : 'opponent-trapped-modal'
  });
});

gameEventBus.subscribe('ShowBoardResizeModal', (payload: ShowBoardResizeModalPayload) => {
  modalService.showBoardResizeModal(payload.newSize);
});

gameEventBus.subscribe('GameOver', (payload: GameOverPayload) => {
  modalService.showGameOverModal(payload);
});
