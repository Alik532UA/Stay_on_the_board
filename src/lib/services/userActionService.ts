// src/lib/services/userActionService.ts
import { get } from 'svelte/store';
import { tick } from 'svelte';
import { modalStore } from '$lib/stores/modalStore.js';
import { gameStore } from '$lib/stores/gameStore';
import { modalService } from './modalService';
import { gameModeService } from './gameModeService';
import { logService } from './logService.js';
import type { Direction } from '$lib/utils/gameUtils';
import { navigationService } from './navigationService';
import { gameSettingsStore, type GameModePreset } from '$lib/stores/gameSettingsStore.js';
import { endGameService } from './endGameService';
import { loadAndGetVoices, filterVoicesByLang } from '$lib/services/speechService.js';
import { openVoiceSettingsModal } from '$lib/stores/uiStore.js';
import { locale } from 'svelte-i18n';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { gameService } from './gameService';
import ReplayViewer from '$lib/components/ReplayViewer.svelte';
import { gameEventBus } from './gameEventBus';
import { sideEffectService } from './sideEffectService';
import { navigateToGame } from './uiService'; // Add this import
import { gameModeStore } from '$lib/stores/gameModeStore';

export const userActionService = {
  selectDirection(direction: Direction): void {
    logService.logicMove(`[userActionService] setDirection called with: ${direction}`);
    const uiState = get(uiStateStore);
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
    
    logService.logicMove('setDirection: встановлено напрямок', { dir: direction, newDistance });
  },

  selectDistance(distance: number): void {
    logService.logicMove(`[userActionService] setDistance called with: ${distance}`);
    uiStateStore.update(s => s ? ({ ...s, selectedDistance: distance }) : null);
  },

  confirmMove(): void {
    const uiState = get(uiStateStore);
    if (uiState?.selectedDirection && uiState?.selectedDistance) {
      this.executeMove(uiState.selectedDirection, uiState.selectedDistance);
    }
  },

  async executeMove(direction: Direction, distance: number): Promise<void> {
    const uiState = get(uiStateStore);
    if (uiState?.isComputerMoveInProgress) return;
    
    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      await activeGameMode.handlePlayerMove(direction, distance);
    }
  },

  async claimNoMoves(): Promise<void> {
    const uiState = get(uiStateStore);
    if (uiState?.isComputerMoveInProgress) return;

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

    const score = playerState.players.reduce((acc: number, p: any) => acc + p.score, 0);
    if (newSize === boardState.boardSize) return;

    // Якщо гра ще не почалася (рахунок 0), змінюємо розмір дошки без підтвердження.
    // Це дозволяє користувачам вільно налаштовувати дошку перед початком гри.
    if (score === 0 && scoreState.penaltyPoints === 0) {
      gameService.initializeNewGame({ size: newSize });
      gameSettingsStore.updateSettings({ boardSize: newSize });
    } else {
      // Якщо гра вже триває, показуємо модальне вікно для підтвердження,
      // оскільки зміна розміру дошки скине поточний прогрес.
      modalService.showBoardResizeModal(newSize);
    }
  },

  

  async requestRestart(): Promise<void> {
    modalStore.closeModal();
    // IMPORTANT: DO NOT CHANGE THIS TO use gameModeStore.
    // This is the single source of truth for the selected game mode preset.
    // It ensures that when a user selects a new mode, we initialize the correct one,
    // not the one that is currently active.
    const activeMode = get(gameSettingsStore).gameMode;
    if (activeMode) {
      gameModeService.initializeGameMode(activeMode, false);
    } else {
      // Fallback, though a mode should always be active when this is called.
      logService.state('ERROR: [userActionService] requestRestart called without an active game mode.');
      const currentBoardSize = get(boardStore)?.boardSize;
      gameService.initializeNewGame({ size: currentBoardSize });
    }
  },

  async requestRestartWithSize(newSize: number): Promise<void> {
    modalStore.closeModal();
    // Ця функція викликається після підтвердження у модальному вікні.
    // Вона перезапускає гру з новим розміром дошки.
    gameService.initializeNewGame({ size: newSize });
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
      buttons: [{ textKey: 'modal.close', onClick: () => modalStore.closeModal() }],
      dataTestId: 'replay-modal',
    });
  },

  async finishWithBonus(reasonKey: string): Promise<void> {
    logService.logicMove('[userActionService] finishWithBonus called with reason:', reasonKey);
    await endGameService.endGame(reasonKey);
  },

  async continueAfterNoMoves(): Promise<void> {
    const activeGameMode = gameModeService.getCurrentMode();
    if (activeGameMode) {
      await activeGameMode.continueAfterNoMoves();
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
    // НАВІЩО (Архітектурне виправлення): Ця функція тепер відповідає ТІЛЬКИ за оновлення
    // налаштувань (SSoT) через виклик атомарного методу в сторі. Ініціалізація гри (SoC)
    // повністю делегована відповідній ігровій сторінці.
    gameSettingsStore.applyPreset(preset);
  },

  navigateToGame(): void {
    navigateToGame();
  }
};