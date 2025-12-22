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
import GameOverContent from '$lib/components/modals/GameOverContent.svelte';
import SimpleModalContent from '$lib/components/modals/SimpleModalContent.svelte';

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

  // FIX: Використовуємо variant="menu" і передаємо колбеки через props
  modalStore.showModal({
    content: content,
    component: GameOverContent,
    variant: 'menu',
    buttons: [], // Кнопки тепер всередині компонента
    closable: false,
    closeOnOverlayClick: false,
    dataTestId: 'game-over-modal',
    props: {
      titleKey,
      titleValues: { winners: winners.map((w: Player) => w.name).join(', '), winnerName: winners[0]?.name },
      mode: 'game-over',
      dataTestId: 'game-over-modal',
      onPlayAgain: () => {
        gameEventBus.dispatch('ReplayGame');
        const uiState = get(uiStateStore);
        if (uiState.intendedGameType !== 'online') {
          modalStore.closeAllModals();
        }
      },
      onWatchReplay: () => {
        gameEventBus.dispatch('RequestReplay');
      },
      onMainMenu: () => {
        navigationService.goToMainMenu();
      }
    }
  });
}

function showBoardResizeModal(newSize: number) {
  modalStore.showModal({
    component: SimpleModalContent,
    variant: 'menu',
    dataTestId: 'board-resize-confirm-modal',
    props: {
      titleKey: 'modal.resetScoreTitle',
      contentKey: 'modal.boardResizeContent',
      actions: [
        {
          labelKey: 'modal.confirm',
          variant: 'primary',
          onClick: () => {
            gameEventBus.dispatch('BoardResizeConfirmed', { newSize });
          },
          dataTestId: 'board-resize-confirm-btn'
        },
        {
          labelKey: 'modal.cancel',
          onClick: () => modalStore.closeModal(),
          dataTestId: 'board-resize-cancel-btn'
        }
      ]
    }
  });
}

export const modalService = {
  showModal: modalStore.showModal,
  closeModal: modalStore.closeModal,
  closeAllModals: modalStore.closeAllModals,
  showGameOverModal,
  showBoardResizeModal,
  subscribe: modalStore.subscribe
};