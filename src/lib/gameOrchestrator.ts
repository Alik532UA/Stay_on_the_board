// src/lib/gameOrchestrator.ts
import { get } from 'svelte/store';
import { playerInputStore } from './stores/playerInputStore.js';
import * as gameLogicService from '$lib/services/gameLogicService.js';
import { settingsStore } from './stores/settingsStore.js';
import { modalService } from '$lib/services/modalService.js';
import { Figure } from '$lib/models/Figure.js';
import { modalStore } from './stores/modalStore.js';
import { agents } from './playerAgents.js';
import { speakText, langMap } from '$lib/services/speechService.js';
import { _ } from 'svelte-i18n';
import { logService } from '$lib/services/logService.js';
import { lastComputerMove } from './stores/derivedState.ts';
import { replayStore } from './stores/replayStore.js';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { stateManager } from './services/stateManager';
import type { Writable } from 'svelte/store';
import { animationStore } from './stores/animationStore';
import { gameState } from './stores/gameState';
import { getAvailableMoves } from '$lib/utils/boardUtils.ts';

/**
 * Інтерфейс для стану гри (локальний для gameOrchestrator)
 */
export interface GameState {
  score: number;
  penaltyPoints: number;
  boardSize: number;
  playerRow: number;
  playerCol: number;
  isGameOver: boolean;
  gameOverReasonKey?: string | null;
  gameOverReasonValues?: Record<string, any> | null;
  noMovesBonus: number;
  noMovesClaimed?: boolean;
  noMovesClaimsCount?: number;
  isComputerMoveInProgress?: boolean;
  moveHistory?: any[];
  [key: string]: any;
}

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
 * Сервіс, що керує ігровим процесом.
 * Він є єдиною точкою входу для дій гравця та координує
 * оновлення стану, хід комп'ютера та побічні ефекти.
 */
export const gameOrchestrator = {
  /**
   * Встановлює новий розмір дошки, обробляючи логіку підтвердження.
   * @param newSize - Новий розмір дошки
   */
  async setBoardSize(newSize: number): Promise<void> {
    const gameStateInstance = gameState;
    const { score, penaltyPoints, boardSize } = get(gameStateInstance);
    if (newSize === boardSize) return;

    if (score === 0 && penaltyPoints === 0) {
      gameLogicService.resetGame({ newSize });
      animationStore.initialize();
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
              gameLogicService.resetGame({ newSize }); 
              animationStore.initialize();
              modalStore.closeModal(); 
            } 
          },
          { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
        ]
      });
    }
  },

  /**
   * Завершує гру з вказаною причиною.
   * @param reasonKey - Ключ причини завершення
   * @param reasonValues - Додаткові значення для причини
   */
  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    const gameStateInstance = gameState;
    const state = get(gameStateInstance);
    const playerInput = get(playerInputStore);
    let finalMoveHistory = [...state.moveHistory]; // Починаємо з копії поточної історії

    // Перевіряємо, чи гра завершилася через невалідний хід гравця
    if (
      (reasonKey === 'modal.gameOverReasonOut' || reasonKey === 'modal.gameOverReasonBlocked') &&
      playerInput.selectedDirection &&
      playerInput.selectedDistance
    ) {
      const figure = new Figure(state.playerRow, state.playerCol, state.boardSize);
      const finalInvalidPosition = figure.calculateNewPosition(
        playerInput.selectedDirection,
        playerInput.selectedDistance
      );

      // Створюємо запис для програшного ходу
      const settings = get(settingsStore); // Отримуємо поточні налаштування
      const finalMoveHistoryEntry = {
        pos: finalInvalidPosition,
        blocked: [] as {row: number, col: number}[], // Не має значення для фінального ходу
        visits: { ...state.cellVisitCounts }, // Стан клітинок перед програшним ходом
        blockModeEnabled: settings.blockModeEnabled // <-- ДОДАЙ ЦЕЙ РЯДОК
      };
      finalMoveHistory.push(finalMoveHistoryEntry);
    }

    // Використовуємо тип any для state, оскільки gameLogicService очікує свій тип GameState
    const finalScoreDetails = gameLogicService.calculateFinalScore(state as any);
    
    // Використовуємо stateManager для завершення гри
    const endGameChanges = {
      isGameOver: true, 
      moveHistory: finalMoveHistory, // <-- ВИКОРИСТОВУЄМО ОНОВЛЕНУ ІСТОРІЮ
      baseScore: finalScoreDetails.baseScore,
      sizeBonus: finalScoreDetails.sizeBonus,
      blockModeBonus: finalScoreDetails.blockModeBonus,
      jumpBonus: finalScoreDetails.jumpBonus,
      finishBonus: finalScoreDetails.finishBonus,
      noMovesBonus: finalScoreDetails.noMovesBonus,
      totalPenalty: finalScoreDetails.totalPenalty,
      totalScore: finalScoreDetails.totalScore,
      gameOverReasonKey: reasonKey,
      gameOverReasonValues: reasonValues,
      cellVisitCounts: {} // --- Очищаємо заблоковані клітини ---
    };
    
    await stateManager.applyChanges('END_GAME', endGameChanges, `Game ended: ${reasonKey}`);
  },

  /**
   * Запускає відтворення гри.
   */
  async startReplay(): Promise<void> {
    console.log('startReplay called');
    const state = get(gameState);
    console.log('Current game state:', {
      isGameOver: state.isGameOver,
      gameOverReasonKey: state.gameOverReasonKey,
      moveHistory: state.moveHistory,
      moveHistoryLength: state.moveHistory?.length,
      boardSize: state.boardSize
    });
    
    if (state.moveHistory && state.moveHistory.length > 0) {
      console.log('Move history found, creating replay data...');
      // 1. Створюємо об'єкт з даними для перегляду
      const replayData = {
        moveHistory: state.moveHistory,
        boardSize: state.boardSize,
        // Додаємо контекст модального вікна для правильного повернення
        modalContext: gameOrchestrator._getCurrentModalContext()
      };

      console.log('Replay data created:', replayData);

      // 2. Зберігаємо дані в sessionStorage
      try {
        sessionStorage.setItem('replayData', JSON.stringify(replayData));
        console.log('Replay data saved to sessionStorage');
        // 3. Переходимо на сторінку перегляду
        console.log('Navigating to replay page...');
        await goto(`${base}/replay`);
        console.log('Navigation completed');
      } catch (error) {
        console.error("Failed to save replay data or navigate:", error);
        // Можна показати повідомлення про помилку, якщо потрібно
      }
    } else {
      console.warn("startReplay called with no move history.", {
        moveHistory: state.moveHistory,
        moveHistoryLength: state.moveHistory?.length
      });
    }
  },

  /**
   * Отримує контекст поточного модального вікна для збереження при переході до replay
   * @returns Контекст модального вікна або null, якщо модальне вікно не відкрите
   */
  _getCurrentModalContext(): any {
    const state = get(gameState);
    const $t = get(_);
    
    console.log('_getCurrentModalContext called with state:', {
      isGameOver: state.isGameOver,
      gameOverReasonKey: state.gameOverReasonKey,
      gameOverReasonValues: state.gameOverReasonValues
    });
    
    // Перевіряємо, чи є відкрите модальне вікно через gameState
    if (state.isGameOver && state.gameOverReasonKey) {
      const reasonKey = state.gameOverReasonKey;
      const reasonValues = state.gameOverReasonValues || {};
      
      switch (reasonKey) {
        case 'modal.playerNoMovesContent':
          return {
            titleKey: 'modal.playerNoMovesTitle',
            content: { 
              reason: 'modal.playerNoMovesContent', 
              scoreDetails: gameLogicService.calculateFinalScore(state as any)
            },
            buttons: [
              { 
                textKey: 'modal.continueGame', 
                customClass: 'green-btn', 
                isHot: true, 
                action: 'continueAfterNoMoves'
              },
              { 
                text: 'modal.finishGameWithBonus', 
                action: 'finalizeGameWithBonus',
                bonus: state.boardSize
              },
              { 
                textKey: 'modal.watchReplay', 
                customClass: 'blue-btn', 
                action: 'startReplay'
              }
            ],
            closable: false
          };
        
        case 'modal.errorContent':
          return {
            titleKey: 'modal.errorTitle',
            content: { 
              reason: 'modal.errorContent', 
              scoreDetails: gameLogicService.calculateFinalScore(state as any),
              reasonValues
            },
            buttons: [
              { 
                textKey: 'modal.playAgain', 
                primary: true, 
                action: 'playAgain',
                isHot: true 
              },
              { 
                textKey: 'modal.watchReplay', 
                customClass: 'blue-btn', 
                action: 'startReplay'
              }
            ],
            closable: false
          };

        case 'modal.computerNoMovesContent':
          return {
            titleKey: 'modal.computerNoMovesTitle',
            content: { 
              reason: 'modal.computerNoMovesContent', 
              scoreDetails: gameLogicService.calculateFinalScore(state as any)
            },
            buttons: [
              { 
                textKey: 'modal.continueGame', 
                customClass: 'green-btn', 
                isHot: true, 
                action: 'continueAfterNoMoves'
              },
              { 
                text: 'modal.finishGameWithBonus', 
                action: 'finalizeGameWithBonus',
                bonus: state.boardSize
              },
              { 
                textKey: 'modal.watchReplay', 
                customClass: 'blue-btn', 
                action: 'startReplay'
              }
            ],
            closable: false
          };

        default:
          return {
            titleKey: 'modal.gameOverTitle',
            content: { 
              reason: reasonKey, 
              scoreDetails: gameLogicService.calculateFinalScore(state as any),
              reasonValues
            },
            buttons: [
              { 
                textKey: 'modal.playAgain', 
                primary: true, 
                action: 'playAgain',
                isHot: true 
              },
              { 
                textKey: 'modal.watchReplay', 
                customClass: 'blue-btn', 
                action: 'startReplay'
              }
            ]
          };
      }
    }
    
    console.log('_getCurrentModalContext: no modal context found, returning null');
    return null;
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
      score: state.score + bonus, // <-- Нараховуємо бонус до основного рахунку
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
        settings.blockModeEnabled
      ),
      noMovesClaimed: false,
      isComputerMoveInProgress: false,
      wasResumed: true,
      isGameOver: false, // <-- Скидаємо стан завершення гри
      gameOverReasonKey: null as string | null, // <-- Очищаємо причину завершення
      gameOverReasonValues: null as Record<string, any> | null // <-- Очищаємо значення причини
    };

    await stateManager.applyChanges('CONTINUE_AFTER_NO_MOVES_CLAIM', continueChanges, 'Player continues after successful no-moves claim');
    
    animationStore.reset();
    
    modalStore.closeModal();
  },

  /**
   * Підтверджує хід гравця.
   */
  async confirmPlayerMove(): Promise<void> {
    const gameStateInstance = gameState;
    const state = get(gameStateInstance);
    const playerInput = get(playerInputStore);
    
    if (!playerInput.selectedDirection || !playerInput.selectedDistance) {
      console.warn('confirmPlayerMove: немає вибраного напрямку або відстані');
      return;
    }

    const startRow = state.playerRow;
    const startCol = state.playerCol;
    
    // Розраховуємо нову позицію
    const direction = playerInput.selectedDirection;
    const distance = playerInput.selectedDistance;
    
    let newRow = startRow;
    let newCol = startCol;
    
    switch (direction) {
      case 'up':
        newRow = Math.max(0, startRow - distance);
        break;
      case 'down':
        newRow = Math.min(state.boardSize - 1, startRow + distance);
        break;
      case 'left':
        newCol = Math.max(0, startCol - distance);
        break;
      case 'right':
        newCol = Math.min(state.boardSize - 1, startCol + distance);
        break;
    }
    
    // Виконуємо хід
    await this._processPlayerMove(startRow, startCol, newRow, newCol);
  },

  /**
   * Заявляє про немає ходів.
   */
  async claimNoMoves(): Promise<void> {
    const state = get(gameState);
    const settings = get(settingsStore);
    
    const availableMoves = getAvailableMoves(
      state.playerRow,
      state.playerCol,
      state.boardSize,
      state.cellVisitCounts,
      settings.blockOnVisitCount,
      state.board,
      settings.blockModeEnabled // <-- Додай цей параметр
    );

    if (availableMoves.length > 0) {
      // Неправильна заява - гравець програв
      this.endGame('modal.errorContent', { count: availableMoves.length });
    } else {
      // Правильна заява - гравець переміг
      // 1. Чекаємо, поки стан ГАРАНТОВАНО оновиться
      await stateManager.applyChanges(
        'SUCCESSFUL_NO_MOVES_CLAIM', 
        { 
          noMovesClaimed: true,
          noMovesBonus: (state.noMovesBonus || 0) + state.boardSize
        }, 
        'Player successfully claimed no moves and bonus is awarded'
      );

      // 2. Тепер отримуємо оновлений стан
      const updatedState = get(gameState);

      // 3. Розраховуємо рахунок на основі оновленого стану
      const potentialScoreDetails = gameLogicService.calculateFinalScore(updatedState as any);

      // 4. Показуємо модальне вікно
      modalStore.showModal({
        titleKey: 'modal.playerNoMovesTitle',
        content: { 
          reason: get(_)('modal.playerNoMovesContent'), 
          scoreDetails: potentialScoreDetails
        },
        buttons: [
          { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: this.continueAfterNoMoves.bind(this) },
          { 
            text: get(_)('modal.finishGameWithBonus', { values: { bonus: updatedState.boardSize } }), 
            onClick: () => this.finalizeGameWithBonus('modal.gameOverReasonBonus') 
          },
          { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: this.startReplay }
        ],
        closable: false
      });
    }
  },

  /**
   * Обробляє хід гравця.
   * @param startRow - Початковий ряд
   * @param startCol - Початкова колонка
   * @param newRow - Новий ряд
   * @param newCol - Нова колонка
   */
  async _processPlayerMove(startRow: number, startCol: number, newRow: number, newCol: number): Promise<void> {
    const playerInput = get(playerInputStore);
    const { selectedDirection, selectedDistance } = playerInput;

    if (!selectedDirection || !selectedDistance) return;

    const moveResult = await gameLogicService.performMove(selectedDirection, selectedDistance, 0);

    if (moveResult.success) {
      // Встановлюємо isFirstMove: false після першого успішного ходу
      const currentState = get(gameState);
      if (currentState.isFirstMove) {
        await stateManager.applyChanges(
          'FIRST_MOVE_COMPLETED',
          { isFirstMove: false },
          'First move completed'
        );
      }
      
      // Скидаємо wasResumed після успішного ходу гравця
      if (currentState.wasResumed) {
        await stateManager.applyChanges(
          'RESET_WAS_RESUMED',
          { wasResumed: false },
          'Resetting wasResumed after successful player move'
        );
      }
      
      playerInputStore.set({
        selectedDirection: null,
        selectedDistance: null,
        distanceManuallySelected: false,
        isMoveInProgress: false
      });
      this._triggerComputerMove();
    } else {
      // --- ПОЧАТОК НОВОГО КОДУ ---
      const state = get(gameState);
      // Обчислюємо фінальну позицію для анімації
      const figure = new Figure(state.playerRow, state.playerCol, state.boardSize);
      const finalInvalidPosition = figure.calculateNewPosition(
        selectedDirection,
        selectedDistance
      );

      // Створюємо об'єкт ходу для черги анімації
      const finalMoveForAnimation = {
        player: 1, // Хід гравця
        direction: selectedDirection,
        distance: selectedDistance,
        to: finalInvalidPosition
      };

      // Додаємо цей хід до черги, щоб animationStore міг його відтворити
      await stateManager.applyChanges(
        'QUEUE_FINAL_MOVE',
        { moveQueue: [...state.moveQueue, finalMoveForAnimation] },
        'Queueing final losing move for animation'
      );
      // --- КІНЕЦЬ НОВОГО КОДУ ---

      // Затримка для завершення анімації програшного ходу
      // Тривалість анімації: 500ms + пауза після ходу гравця: 1000ms = 1500ms
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Обробка невдалих ходів (цей код вже існує, залиш його)
      if (moveResult.reason === 'out_of_bounds') {
        this.endGame('modal.gameOverReasonOut');
      } else if (moveResult.reason === 'blocked_cell') {
        this.endGame('modal.gameOverReasonBlocked');
      }
    }
  },

  /**
   * Запускає хід комп'ютера.
   */
  async _triggerComputerMove(): Promise<void> {
    const gameStateInstance = gameState;
    const state = get(gameStateInstance);
    
    // Встановлюємо прапорець ходу комп'ютера
    await stateManager.applyChanges('SET_COMPUTER_TURN', { isComputerMoveInProgress: true }, 'Starting computer move');
    
    // Логування стану перед ходом комп'ютера
    console.log('[gameOrchestrator] _triggerComputerMove: state перед getMove', state);
    // Отримуємо хід комп'ютера - використовуємо any для state
    const computerMove = await agents.ai.getMove(state as any);
    console.log('[gameOrchestrator] _triggerComputerMove: computerMove =', computerMove);
    
    if (computerMove) {
      // Виконуємо хід комп'ютера
      const { direction, distance } = computerMove;
      console.log('[gameOrchestrator] _triggerComputerMove: performMove для компʼютера', direction, distance);
      const moveResult = await gameLogicService.performMove(direction, distance, 1);
      console.log('[gameOrchestrator] _triggerComputerMove: moveResult для компʼютера', moveResult);
      console.log('[gameOrchestrator] _triggerComputerMove: moveQueue після ходу компʼютера:', get(gameStateInstance).moveQueue);
      
      if (!moveResult.success) {
        // Якщо хід невалідний — показуємо модальне вікно з вибором
        const currentState = get(gameState);
        // 1. Чекаємо, поки стан ГАРАНТОВАНО оновиться
        await stateManager.applyChanges(
          'SUCCESSFUL_NO_MOVES_CLAIM', 
          { 
            noMovesClaimed: true,
            noMovesBonus: (currentState.noMovesBonus || 0) + currentState.boardSize
          }, 
          'Computer has no valid moves and bonus is awarded'
        );

        // 2. Тепер отримуємо оновлений стан
        const updatedState = get(gameState);
        const $t = get(_);

        // 3. Розраховуємо рахунок на основі оновленого стану
        const potentialScoreDetails = gameLogicService.calculateFinalScore(updatedState as any);

        // 4. Показуємо модальне вікно
        modalStore.showModal({
          titleKey: 'modal.computerNoMovesTitle',
          content: { 
            reason: $t('modal.computerNoMovesContent'), 
            scoreDetails: potentialScoreDetails
          },
          buttons: [
            { 
              textKey: 'modal.continueGame', 
              customClass: 'green-btn', 
              isHot: true, 
              onClick: this.continueAfterNoMoves.bind(this) 
            },
            { 
              text: $t('modal.finishGameWithBonus', { values: { bonus: updatedState.boardSize } }), 
              onClick: () => this.finalizeGameWithBonus('modal.gameOverReasonBonus') 
            },
            { 
              textKey: 'modal.watchReplay', 
              customClass: 'blue-btn', 
              onClick: this.startReplay 
            }
          ],
          closable: false
        });
      } else {
        // Скидаємо wasResumed після успішного ходу комп'ютера
        const currentState = get(gameState);
        if (currentState.wasResumed) {
          await stateManager.applyChanges(
            'RESET_WAS_RESUMED_AFTER_COMPUTER_MOVE',
            { wasResumed: false },
            'Resetting wasResumed after successful computer move'
          );
        }
        
        // Обробляємо побічні ефекти
        this._handleComputerMoveSideEffects(computerMove);
      }
    } else {
      // Комп'ютер не може зробити хід - показуємо модальне вікно з вибором
      const currentState = get(gameState);
      // 1. Чекаємо, поки стан ГАРАНТОВАНО оновиться
      await stateManager.applyChanges(
        'SUCCESSFUL_NO_MOVES_CLAIM', 
        { 
          noMovesClaimed: true,
          noMovesBonus: (currentState.noMovesBonus || 0) + currentState.boardSize
        }, 
        'Computer has no moves and bonus is awarded'
      );

      // 2. Тепер отримуємо оновлений стан
      const updatedState = get(gameState);
      const $t = get(_);

      // 3. Розраховуємо рахунок на основі оновленого стану
      const potentialScoreDetails = gameLogicService.calculateFinalScore(updatedState as any);

      // 4. Встановлюємо стан гри як завершений для правильного відновлення модального вікна
      await stateManager.applyChanges(
        'SET_GAME_OVER_FOR_MODAL', 
        { 
          isGameOver: true,
          gameOverReasonKey: 'modal.computerNoMovesContent',
          gameOverReasonValues: null
        }, 
        'Setting game over state for computer no moves modal'
      );

      // 5. Показуємо модальне вікно
      modalStore.showModal({
        titleKey: 'modal.computerNoMovesTitle',
        content: { 
          reason: $t('modal.computerNoMovesContent'), 
          scoreDetails: potentialScoreDetails
        },
        buttons: [
          { 
            textKey: 'modal.continueGame', 
            customClass: 'green-btn', 
            isHot: true, 
            onClick: this.continueAfterNoMoves.bind(this) 
          },
          { 
            text: $t('modal.finishGameWithBonus', { values: { bonus: updatedState.boardSize } }), 
            onClick: () => this.finalizeGameWithBonus('modal.gameOverReasonBonus') 
          },
          { 
            textKey: 'modal.watchReplay', 
            customClass: 'blue-btn', 
            onClick: this.startReplay 
          }
        ],
        closable: false
      });
    }
    
    // Скидаємо прапорець ходу комп'ютера
    await stateManager.applyChanges('SET_PLAYER_TURN', { isComputerMoveInProgress: false }, 'Computer move completed');
  },

  /**
   * Обробляє побічні ефекти ходу комп'ютера.
   * @param move - Хід комп'ютера
   */
  _handleComputerMoveSideEffects(move: any): void {
    // Логуємо хід
    logService.info('Computer move', move);
    
    // Озвучуємо хід (якщо увімкнено) - тимчасово відключено через проблеми з типами
    const settings = get(settingsStore);
    if (settings.speechEnabled) {
      console.log('Speech functionality temporarily disabled due to type issues');
      // TODO: Виправити типи для speech функціональності
    }
  }
}; 