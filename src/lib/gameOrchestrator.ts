// src/lib/gameOrchestrator.ts
import { get } from 'svelte/store';
import { playerInputStore } from './stores/playerInputStore.js';
import * as gameLogicService from '$lib/services/gameLogicService.js';
import { settingsStore } from './stores/settingsStore';
import { Figure } from '$lib/models/Figure.js';
import { modalStore } from './stores/modalStore.js';
import { agents } from './playerAgents.js';
import { speakText, langMap } from '$lib/services/speechService.js';
import { _, locale } from 'svelte-i18n';
import { moveDirections } from '$lib/utils/translations';
import { logService } from '$lib/services/logService.js';
import { lastComputerMove, lastPlayerMove } from './stores/derivedState.ts';
import { replayStore } from './stores/replayStore.js';
import { base } from '$app/paths';
import { goto } from '$app/navigation';
import { stateManager } from './services/stateManager';
import type { Writable } from 'svelte/store';
import { animationStore } from './stores/animationStore';
import { gameState } from './stores/gameState';
import { replayService } from './services/replayService';
import { gameStore } from './stores/gameStore';
import { localGameStore } from './stores/localGameStore';
import { gameOverStore } from './stores/gameOverStore';
import { getAvailableMoves } from '$lib/utils/boardUtils.ts';

import { VsComputerGameMode } from './gameModes/VsComputerGameMode';
import { LocalGameMode } from './gameModes/LocalGameMode';
import type { IGameMode } from './gameModes/gameMode.interface';

/**
 * Інтерфейс для кінцевого рахунку
 */
export interface FinalScoreDetails {
  baseScore: number;
  sizeBonus: number;
  blockModeBonus: number;
  jumpBonus: number;
  finishBonus: number;
  noMovesBonus: number;
  totalPenalty: number;
  totalScore: number;
}

/**
 * Інтерфейс для контенту модального вікна
 */
export interface ModalContent {
  reason: string;
  scoreDetails: FinalScoreDetails;
  playerScores?: Array<{
    playerNumber: number;
    score: number;
    isWinner: boolean;
  }>;
  winnerNumber?: number;
  winnerNumbers?: string;
  winnerName?: string;
}

export const gameOrchestrator = {
  setCurrentGameMode(mode: 'local' | 'vs-computer') {
    logService.GAME_MODE(`Setting game mode to: ${mode}`);
    let gameMode: IGameMode;
    if (mode === 'local') {
      gameMode = new LocalGameMode();
    } else {
      gameMode = new VsComputerGameMode();
    }
    gameMode.initialize(get(gameState));
    gameStore.setMode(gameMode);
  },

  initializeGameMode() {
    const gameType = this._determineGameType();
    this.setCurrentGameMode(gameType as 'local' | 'vs-computer');
  },
  /**
   * Встановлює новий розмір дошки, обробляючи логіку підтвердження.
   * @param newSize - Новий розмір дошки
   */
  async setBoardSize(newSize: number): Promise<void> {
    const { players, penaltyPoints, boardSize } = get(gameState);
    const score = players.reduce((acc, p) => acc + p.score, 0);
    if (newSize === boardSize) return;

    if (score === 0 && penaltyPoints === 0) {
      gameLogicService.resetGame({ newSize }, get(gameState));
    } else {
      modalStore.showModal({
        titleKey: 'modal.resetScoreTitle',
        contentKey: 'modal.resetScoreContent',
        buttons: [
          {
            textKey: 'modal.resetScoreConfirm',
            customClass: 'green-btn',
            isHot: true,
            onClick: () => {
              gameLogicService.resetGame({ newSize }, get(gameState));
              modalStore.closeModal();
            }
          },
          { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
        ]
      });
    }
  },

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) this.initializeGameMode();
    await activeGameMode!.endGame(reasonKey, reasonValues);
  },

  async restartGame(): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) this.initializeGameMode();
    await activeGameMode!.restartGame();
  },

  /**
   * Запускає відтворення гри.
   */
  async startReplay(): Promise<void> {
    const gameType = this._determineGameType();
    replayService.saveReplayData(gameType);
    await goto(`${base}/replay`);
  },

  /**
   * Визначає тип гри на основі поточного стану
   * @returns 'local' або 'vs-computer'
   */
  _determineGameType(): string {
    // Використовуємо поточний URL для визначення типу гри
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/game/local')) {
      return 'local';
    } else if (currentPath.includes('/game/vs-computer')) {
      return 'vs-computer';
    }
    
    // Якщо не можемо визначити з URL, використовуємо fallback логіку
    const localGameState = get(localGameStore);
    // Для гри проти комп'ютера зазвичай використовується тільки 1 гравець
    // але localGameStore завжди містить 4 гравців, тому ця логіка не надійна
    // Повертаємо 'vs-computer' як за замовчуванням, оскільки це більш поширений випадок
    return 'vs-computer';
  },


  /**
   * Завершує гру з бонусом за немає ходів.
   * @param reasonKey - Ключ причини завершення
   */
  async finalizeGameWithBonus(reasonKey: string): Promise<void> {
    // Спочатку встановлюємо прапорець, що гра завершена за ініціативою гравця з модального вікна
    await stateManager.applyChanges(
      'SET_FINISH_FLAG',
      { finishedByFinishButton: true },
      'Player chose to finish with a bonus'
    );
    
    // Тепер викликаємо endGame, який використає цей прапорець для розрахунку бонусу
    await this.endGame(reasonKey);
  },

  /**
   * Продовжує гру після заяви про немає ходів.
   */
  async continueAfterNoMoves(): Promise<void> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const bonus = state.boardSize; // <-- Бонус дорівнює розміру дошки

    const continueChanges = {
      // Рахунок тепер оновлюється для конкретного гравця в `gameLogicService`
      noMovesBonus: state.noMovesBonus + bonus, // <-- Додаємо до лічильника бонусів
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
      isGameOver: false, // <-- Скидаємо стан завершення гри
      gameOverReasonKey: null as string | null, // <-- Очищаємо причину завершення
      gameOverReasonValues: null as Record<string, any> | null // <-- Очищаємо значення причини
    };

    await stateManager.applyChanges('CONTINUE_AFTER_NO_MOVES_CLAIM', continueChanges, 'Player continues after successful no-moves claim');
    
    // Скидаємо стан завершення гри при продовженні
    gameOverStore.resetGameOverState();
    
    animationStore.reset();
    
    modalStore.closeModal();
  },

  async confirmPlayerMove(): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) this.initializeGameMode();
    const playerInput = get(playerInputStore);
    if (!playerInput.selectedDirection || !playerInput.selectedDistance) return;
    
    await activeGameMode!.handlePlayerMove(playerInput.selectedDirection, playerInput.selectedDistance);

    const settings = get(settingsStore);
    if (settings.speechEnabled && this._determineGameType() === 'local') {
      const allVoices = window.speechSynthesis.getVoices();
      const selectedVoice = allVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
      const speechLang = selectedVoice ? selectedVoice.lang.split('-')[0] : (get(locale) || 'uk');
      
      const directionKey = playerInput.selectedDirection.replace(/-(\w)/g, (_, c) => c.toUpperCase());
      // @ts-ignore
      const direction = moveDirections[speechLang][directionKey];
      const textToSpeak = `${direction} ${playerInput.selectedDistance}`;
      speakText(textToSpeak, speechLang, settings.selectedVoiceURI);
    }
  },

  async claimNoMoves(): Promise<void> {
    const activeGameMode = get(gameStore).mode;
    if (!activeGameMode) this.initializeGameMode();
    await activeGameMode!.claimNoMoves();
  },

  // All the logic is now delegated to the activeGameMode

};