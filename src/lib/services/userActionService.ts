import { get } from 'svelte/store';
import { tick } from 'svelte';
import { modalStore } from '$lib/stores/modalStore';
import { gameModeService } from './gameModeService';
import { logService } from './logService';
import type { Direction } from '$lib/utils/gameUtils';
import { navigationService } from './navigationService';
import { gameSettingsStore, type GameModePreset } from '$lib/stores/gameSettingsStore.js';
import { endGameService } from './endGameService';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { gameService } from './gameService';
import ReplayViewer from '$lib/components/ReplayViewer.svelte';
import { gameEventBus } from './gameEventBus';
import { modalService } from './modalService';
import { navigateToGame } from './uiService';

export const userActionService = {
  selectDirection(direction: Direction): void {
    const uiState = get(uiStateStore);
    // FIX: Блокуємо вибір, якщо гра завершена
    if (uiState?.isGameOver) return;

    logService.logicMove(`[userActionService] setDirection called with: ${direction}`);
    const boardState = get(boardStore);
    if (!uiState || !boardState) return;

    const { boardSize } = boardState;
    const { selectedDirection, selectedDistance } = uiState;
    const maxDist = boardSize - 1;
    let newDistance = selectedDistance;

    if (selectedDirection !== direction) {
      newDistance = 1;
    } else {
      newDistance = (!selectedDistance || selectedDistance >= maxDist) ? 1 : selectedDistance + 1;
    }

    uiStateStore.update(s => s ? ({ ...s, selectedDirection: direction, selectedDistance: newDistance }) : null);
  },

  selectDistance(distance: number): void {
    const uiState = get(uiStateStore);
    // FIX: Блокуємо вибір, якщо гра завершена
    if (uiState?.isGameOver) return;

    logService.logicMove(`[userActionService] setDistance called with: ${distance}`);
    uiStateStore.update(s => s ? ({ ...s, selectedDistance: distance }) : null);
  },

  confirmMove(): void {
    const uiState = get(uiStateStore);
    // FIX: Блокуємо підтвердження, якщо гра завершена
    if (uiState?.isGameOver) return;

    if (uiState?.selectedDirection && uiState?.selectedDistance) {
      this.executeMove(uiState.selectedDirection, uiState.selectedDistance);
    }
  },

  async executeMove(direction: Direction, distance: number): Promise<void> {
    const uiState = get(uiStateStore);
    // FIX: Блокуємо виконання, якщо гра завершена або йде хід комп'ютера
    if (uiState?.isComputerMoveInProgress || uiState?.isGameOver) return;

    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      await activeGameMode.handlePlayerMove(direction, distance);
    }
  },

  async claimNoMoves(): Promise<void> {
    const uiState = get(uiStateStore);
    // FIX: Блокуємо дію, якщо гра завершена
    if (uiState?.isComputerMoveInProgress || uiState?.isGameOver) return;

    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      await activeGameMode.claimNoMoves();
    }
  },

  async changeBoardSize(newSize: number): Promise<void> {
    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);
    if (!boardState || !playerState || !scoreState) return;

    const score = playerState.players.reduce((acc: number, p: { score: number }) => acc + p.score, 0);
    if (newSize === boardState.boardSize) return;

    if (score === 0 && scoreState.penaltyPoints === 0) {
      const activeGameMode = gameModeService.getCurrentMode();
      if (activeGameMode) {
        activeGameMode.restartGame({ newSize });
      } else {
        gameService.initializeNewGame({ size: newSize });
      }
      gameSettingsStore.updateSettings({ boardSize: newSize });
    } else {
      modalService.showBoardResizeModal(newSize);
    }
  },

  async requestRestart(): Promise<void> {
    modalStore.closeModal();

    const currentMode = gameModeService.getCurrentMode();
    const currentModeName = currentMode?.getModeName();

    if (currentModeName === 'online') {
      logService.action('[userActionService] Online mode detected. Skipping local restart logic. Waiting for OnlineGameMode handler.');
      return;
    }

    if (currentModeName === 'local') {
      gameModeService.initializeGameMode('local', false);
    } else {
      const settings = get(gameSettingsStore);
      if (settings.gameMode) {
        gameModeService.initializeGameMode(settings.gameMode, false);
      } else {
        if (currentMode) {
          currentMode.restartGame();
        } else {
          logService.state('ERROR: [userActionService] requestRestart called without an active game mode or setting.');
          const currentBoardSize = get(boardStore)?.boardSize;
          gameService.initializeNewGame({ size: currentBoardSize });
        }
      }
    }
  },

  async requestRestartWithSize(newSize: number): Promise<void> {
    modalStore.closeModal();
    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      activeGameMode.restartGame({ newSize });
    } else {
      gameService.initializeNewGame({ size: newSize });
    }
    gameSettingsStore.updateSettings({ boardSize: newSize });
  },

  async requestReplay(): Promise<void> {
    const boardState = get(boardStore);
    if (!boardState) return;
    const { moveHistory, boardSize } = boardState;

    modalStore.showModal({
      component: ReplayViewer,
      props: {
        moveHistory,
        boardSize,
        autoPlayForward: true
      },
      titleKey: 'replay.title',
      buttons: [{
        textKey: 'modal.close',
        onClick: () => gameEventBus.dispatch('CloseModal')
      }],
      dataTestId: 'replay-modal',
    });
  },

  async finishWithBonus(reasonKey: string): Promise<void> {
    // FIX: Перевірка на завершення гри тут теж корисна, хоча основний захист в endGameService
    if (get(uiStateStore).isGameOver) return;

    logService.logicMove('[userActionService] finishWithBonus called with reason:', reasonKey);
    await endGameService.endGame(reasonKey);
  },

  async continueAfterNoMoves(): Promise<void> {
    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      await activeGameMode.continueAfterNoMoves();
    }
  },

  // --- Нові методи для голосування ---

  async voteToContinue(): Promise<void> {
    const activeGameMode = gameModeService.getCurrentMode();
    // Перевіряємо, чи це OnlineGameMode (через перевірку наявності методу)
    if (activeGameMode && 'voteToContinue' in activeGameMode) {
      // @ts-ignore
      await activeGameMode.voteToContinue();
    } else {
      // Локальний режим - просто продовжуємо
      await this.continueAfterNoMoves();
    }
  },

  async voteToFinish(reasonKey: string): Promise<void> {
    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode && 'voteToFinish' in activeGameMode) {
      // @ts-ignore
      await activeGameMode.voteToFinish();
    } else {
      // Локальний режим - завершуємо
      await this.finishWithBonus(reasonKey);
    }
  },

  async handleModalAction(action: string, payload?: any): Promise<void> {
    const uiState = get(uiStateStore);
    if (uiState?.isComputerMoveInProgress) {
      return;
    }
    try {
      logService.logicMove('[userActionService] Input locked: isComputerMoveInProgress=true');
      switch (action) {
        case 'restartGame':
        case 'playAgain':
          await this.requestRestart();
          break;
        case 'requestReplay':
          await this.requestReplay();
          break;
        case 'finishWithBonus':
          // Використовуємо новий метод голосування
          await this.voteToFinish(payload.reasonKey);
          break;
        case 'continueAfterNoMoves':
          // Використовуємо новий метод голосування
          await this.voteToContinue();
          break;
        case 'resetGame':
          const activeGameMode = gameModeService.getCurrentMode();
          if (activeGameMode) {
            await activeGameMode.restartGame({ newSize: payload.newSize });
          }
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
      await tick();
      logService.logicMove('[userActionService] Input unlocked: isMoveInProgress=false');
    }
  },

  async toggleSpeech(): Promise<void> {
    gameSettingsStore.toggleSpeech();
  },

  resetKeybindings(): void {
    gameSettingsStore.resetKeybindings();
  },

  setGameModePreset(preset: GameModePreset): void {
    gameSettingsStore.applyPreset(preset);
  },

  navigateToGame(): void {
    navigateToGame();
  }
};