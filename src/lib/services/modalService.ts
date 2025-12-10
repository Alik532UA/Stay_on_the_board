import { modalStore, type ModalState } from '$lib/stores/modalStore';
import { navigationService } from './navigationService';
import { gameEventBus } from './gameEventBus';
import { get } from 'svelte/store';
import { _, locale } from 'svelte-i18n';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { speakText } from './speechService';
import type { Player } from '$lib/models/player';
import type { GameOverPayload, PlayerScoreResult, FinalScoreDetails } from '$lib/stores/gameOverStore';
import { uiStateStore } from '$lib/stores/uiStateStore';

interface GameOverModalContent {
  reasonKey: string;
  reason: string;
  scoreDetails: FinalScoreDetails;
  playerScores?: Array<PlayerScoreResult & { playerName: string; playerColor: string; isWinner: boolean; isLoser: boolean }>;
  winnerName?: string;
  winnerNumbers?: string;
}

function showGameOverModal(payload: GameOverPayload) {
  const { reasonKey, reasonValues, finalScoreDetails, winners, gameType } = payload;

  let titleKey = 'modal.gameOverTitle';
  let content: GameOverModalContent = {
    reasonKey: reasonKey,
    reason: get(_)(reasonKey, { values: reasonValues }),
    scoreDetails: finalScoreDetails
  };

  if (gameType === 'training' || gameType === 'virtual-player') {
    titleKey = 'modal.trainingOverTitle';
  } else if (gameType === 'local' || gameType === 'online') {
    titleKey = winners && winners.length === 1 ? 'modal.winnerTitle' : 'modal.drawTitle';
    content.playerScores = payload.scores.map((s: PlayerScoreResult) => ({
      ...s,
      playerName: s.name,
      playerColor: s.color,
      isWinner: winners.some((w: Player) => w.id === s.playerId),
      isLoser: payload.loser !== null && payload.loser.id === s.playerId
    }));

    if (winners && winners.length === 1) {
      content.winnerName = winners[0].name;
    } else if (winners && winners.length > 1) {
      content.winnerNumbers = winners.map((w: Player) => w.name).join(', ');
    }
  }

  if (get(gameSettingsStore).speakModalTitles) {
    const speechValues: { winners?: string; winnerName?: string } = { winners: winners ? winners.map((w: Player) => w.name).join(', ') : '' };
    if (winners && winners.length === 1) {
      speechValues.winnerName = winners[0].name;
    }
    const title = get(_)(titleKey, { values: speechValues });
    const lang = get(locale) || 'uk';
    const voiceURI = get(gameSettingsStore).selectedVoiceURI;
    speakText(title, lang, voiceURI, undefined);
  }

  modalStore.showModal({
    titleKey: titleKey,
    content: content,
    props: { winners: winners.map((w: Player) => w.name).join(', ') },
    closable: false,
    closeOnOverlayClick: false,
    dataTestId: 'game-over-modal',
    buttons: [
      {
        textKey: 'modal.playAgain',
        primary: true,
        onClick: () => {
          gameEventBus.dispatch('ReplayGame');
          const uiState = get(uiStateStore);
          if (uiState.intendedGameType !== 'online') {
            modalStore.closeAllModals();
          }
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
  closeAllModals: modalStore.closeAllModals, // FIX: Додано експорт
  showGameOverModal,
  showBoardResizeModal,
  subscribe: modalStore.subscribe
};