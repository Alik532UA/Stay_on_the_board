import { modalStore, type ModalState } from '$lib/stores/modalStore';
import { navigationService } from './navigationService';
import { gameEventBus } from './gameEventBus';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

function showGameOverModal(payload: any) {
  const { reasonKey, reasonValues, finalScoreDetails, winners, gameType } = payload;

  let titleKey = 'modal.gameOverTitle';
  let content: any = {
    reasonKey: reasonKey,
    reason: get(_)(reasonKey, { values: reasonValues }), 
    scoreDetails: finalScoreDetails
  };

  if (gameType === 'training' || gameType === 'virtual-player') {
    titleKey = 'modal.trainingOverTitle';
  } else {
    // For local games, show player scores
    titleKey = winners && winners.length === 1 ? 'modal.winnerTitle' : 'modal.drawTitle';
    content.playerScores = payload.scores.map((s: any) => ({ ...s, isWinner: winners.some((w: any) => w.id === s.playerId) }));
  }

  modalStore.showModal({
    titleKey: titleKey,
    content: content,
    props: { winners: winners.map((w: any) => w.name).join(', ') },
    closable: false,
    closeOnOverlayClick: false,
    dataTestId: 'game-over-modal',
    buttons: [
        {
            textKey: 'modal.playAgain',
            primary: true,
            onClick: () => {
                gameEventBus.dispatch('ReplayGame');
                modalStore.closeAllModals();
            },
            dataTestId: 'play-again-btn'
        },
        {
            textKey: 'modal.watchReplay',
            onClick: () => {
                gameEventBus.dispatch('RequestReplay');
            },
            dataTestId: 'watch-replay-btn'
        },
        {
            textKey: 'modal.mainMenu',
            onClick: () => {
                navigationService.goToMainMenu();
            },
            dataTestId: 'game-over-main-menu-btn'
        }
    ]
  });
}

function showBoardResizeModal(newSize: number) {
    modalStore.showModal({
        titleKey: 'modal.resetScoreTitle',
        contentKey: 'modal.boardResizeContent',
        props: { newSize },
        buttons: [
            {
                textKey: 'modal.confirm',
                primary: true,
                onClick: () => {
                    gameEventBus.dispatch('BoardResizeConfirmed', { newSize });
                },
                dataTestId: 'board-resize-confirm-btn'
            },
            {
                textKey: 'modal.cancel',
                onClick: () => modalStore.closeModal(),
                dataTestId: 'board-resize-cancel-btn'
            }
        ],
        dataTestId: 'board-resize-confirm-modal'
    });
}

export const modalService = {
  showModal: modalStore.showModal,
  closeModal: modalStore.closeModal,
  showGameOverModal,
  showBoardResizeModal,
  subscribe: modalStore.subscribe
};
