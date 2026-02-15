// src/lib/gameModes/BaseGameMode.ts
import { get } from 'svelte/store';
import { tick } from 'svelte';
import { aiService } from '$lib/services/aiService';
import type { IGameMode } from './gameMode.interface';
import type { Player } from '$lib/models/player';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import { Piece, type MoveDirectionType } from '../models/Piece';
import type { GameMoveResult, SuccessfulMoveResult, ScoreChangesData, MoveQueueItem } from '$lib/types/gameMove';
import { logService } from '$lib/services/logService';
import { animationService } from '$lib/services/animationService';
import { endGameService } from '$lib/services/endGameService';
import { noMovesService } from '$lib/services/noMovesService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { timeService } from '$lib/services/timeService';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { appSettingsStore } from '$lib/stores/appSettingsStore';
import { uiEffectsStore } from '$lib/stores/uiEffectsStore';
import { voiceControlService } from '$lib/services/voiceControlService';
import { GameEngine } from '$lib/logic/GameEngine';

export abstract class BaseGameMode implements IGameMode {
  public turnDuration: number = 0;
  public gameDuration: number = 0;
  protected engine: GameEngine | null = null;

  abstract getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player';
  abstract initialize(options?: { newSize?: number }): void;
  abstract getPlayersConfiguration(): Player[];

  protected initEngine(): void {
    // Скидаємо старий двигун перед ініціалізацією нового
    this.engine = null;

    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);
    const uiState = get(uiStateStore);
    const settings = get(gameSettingsStore);

    if (boardState && playerState && scoreState) {
      const combinedState = { ...boardState, ...playerState, ...scoreState, ...uiState };
      this.engine = new GameEngine(combinedState, settings);
    }
  }

  // Змінено з abstract на virtual (з дефолтною реалізацією)
  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    await noMovesService.dispatchNoMovesEvent(playerType);
  }

  // Змінено з abstract на virtual
  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);
    this.resetBoardForContinuation();

    // Специфічна логіка: після "немає ходів" зазвичай хід повертається до людини
    const playerState = get(playerStore);
    const humanPlayerIndex = playerState?.players.findIndex(p => p.type === 'human');

    if (humanPlayerIndex !== undefined && humanPlayerIndex !== -1) {
      playerStore.update(s => s ? { ...s, currentPlayerIndex: humanPlayerIndex } : null);
      logService.GAME_MODE('continueAfterNoMoves: Хід повернуто гравцю-людині.', { humanPlayerIndex });
    } else {
      await this.advanceToNextPlayer();
    }

    this.startTurn();
    gameEventBus.dispatch('CloseModal', undefined);
  }

  // Змінено з abstract на virtual
  protected async advanceToNextPlayer(): Promise<void> {
    logService.GAME_MODE('advanceToNextPlayer: Передача ходу наступному гравцю.');
    const currentPlayerState = get(playerStore);
    if (!currentPlayerState) return;
    const nextPlayerIndex = (currentPlayerState.currentPlayerIndex + 1) % currentPlayerState.players.length;

    playerStore.update(s => s ? { ...s, currentPlayerIndex: nextPlayerIndex } : null);

    const nextPlayer = get(playerStore)?.players[nextPlayerIndex];
    logService.GAME_MODE(`advanceToNextPlayer: Наступний гравець: ${nextPlayer?.type} (індекс ${nextPlayerIndex}).`);

    if (nextPlayer?.type === 'ai' || nextPlayer?.type === 'computer') {
      logService.GAME_MODE('advanceToNextPlayer: Заплановано хід комп\'ютера (через таймер).');
      // НАВІЩО: Використовуємо setTimeout(0), щоб розірвати ланцюжок синхронних викликів.
      // Це дає Svelte-сторам та UI можливість оновитися ПЕРЕД початком нового ходу.
      setTimeout(() => {
        this.triggerComputerMove();
      }, 0);
    } else {
      this.startTurn();
    }
  }

  // Змінено з abstract на virtual
  protected async applyScoreChanges(scoreChanges: ScoreChangesData): Promise<void> {
    // Default implementation: do nothing (override in specific modes if needed)
  }

  /**
   * Скидає стан дошки для продовження гри після "немає ходів".
   * Використовується в різних GameModes для уникнення дублювання.
   * 
   * ВАЖЛИВО: Цей метод лише скидає стан дошки і оновлює доступні ходи.
   * Специфічна логіка режиму (перемикання гравців, таймери) залишається в конкретних реалізаціях.
   */
  protected resetBoardForContinuation(): void {
    const boardState = get(boardStore);
    const settings = get(gameSettingsStore);
    if (!boardState) return;

    const continuationData = {
      cellVisitCounts: {} as Record<string, number>,
      moveHistory: [{
        pos: { row: boardState.playerRow!, col: boardState.playerCol! },
        blocked: [] as { row: number; col: number }[],
        visits: {},
        blockModeEnabled: settings.blockModeEnabled
      }],
      moveQueue: [] as MoveQueueItem[],
    };

    boardStore.update(s => s ? ({ ...s, ...continuationData }) : null);

    // Оновлюємо двигун при скиданні дошки, використовуючи актуальні дані
    if (this.engine) {
      const playerState = get(playerStore);
      const scoreState = get(scoreStore);
      if (playerState && scoreState) {
        const engineState = {
          ...boardState,
          ...continuationData,
          ...playerState,
          ...scoreState
        };
        this.engine = new GameEngine(engineState, settings);
      }
    }

    availableMovesService.updateAvailableMoves();
    gameOverStore.resetGameOverState();
    animationService.reset();
  }

  protected startTurn(): void {
    if (this.turnDuration > 0) {
      timeService.startTurnTimer(this.turnDuration, () => {
        endGameService.endGame('modal.gameOverReasonTimeUp');
      });
    }
  }

  async claimNoMoves(): Promise<void> {
    await noMovesService.claimNoMoves();
  }

  async handlePlayerMove(direction: MoveDirectionType, distance: number, onEndCallback?: () => void): Promise<void> {
    if (!this.engine) {
      this.initEngine();
    }

    if (!this.engine) {
      logService.error('[BaseGameMode] Failed to initialize engine for move.');
      return;
    }

    const playerState = get(playerStore);
    if (!playerState) return;

    // Оновлюємо налаштування в двигуні перед ходом (на випадок змін)
    this.engine.updateSettings(get(gameSettingsStore));

    const moveResult = this.engine.performMove(
      direction,
      distance,
      playerState.currentPlayerIndex,
      this.getModeName()
    );

    if (moveResult.success && moveResult.changes) {
      // МИТТЄВЕ оновлення сторів (для логіки)
      boardStore.update(s => s ? ({ ...s, ...moveResult.changes!.boardState }) : null);
      playerStore.update(s => s ? ({ ...s, ...moveResult.changes!.playerState }) : null);
      scoreStore.update(s => s ? ({ ...s, ...moveResult.changes!.scoreState }) : null);

      // Event-Driven UI: Повідомляємо про успішний хід
      gameEventBus.dispatch('GAME_MOVE_SUCCESS', {
        direction,
        distance,
        playerIndex: playerState.currentPlayerIndex,
        bonusPoints: moveResult.bonusPoints || 0,
        penaltyPoints: moveResult.penaltyPoints || 0,
        newPosition: moveResult.newPosition!
      });

      const newMove = moveResult.changes.boardState.moveQueue!.slice(-1)[0];
      if (newMove) {
        // Візуалізація дошки підпишеться на цей івент
        gameEventBus.dispatch('new_move_added', newMove);
      }

      await this.applyScoreChanges({
        bonusPoints: moveResult.bonusPoints || 0,
        penaltyPoints: moveResult.penaltyPoints || 0
      });

      // Обробка побічних ефектів (TTS)
      const settings = get(gameSettingsStore);
      const currentPlayer = playerState.players[playerState.currentPlayerIndex];
      let shouldSpeak = false;

      if (settings.speechEnabled) {
        const uiState = get(uiStateStore);
        if (uiState.intendedGameType === 'online') {
          shouldSpeak = playerState.currentPlayerIndex === uiState.onlinePlayerIndex
            ? settings.speechFor.onlineMyMove
            : settings.speechFor.onlineOpponentMove;
        } else {
          shouldSpeak = (currentPlayer.isComputer && settings.speechFor.computer) ||
            (!currentPlayer.isComputer && settings.speechFor.player);
        }
      }

      if (shouldSpeak || onEndCallback) {
        sideEffectService.execute({
          type: 'speak_move',
          payload: {
            move: { direction, distance },
            lang: get(appSettingsStore).language || 'uk',
            voiceURI: settings.selectedVoiceURI,
            onEndCallback,
            force: true
          }
        });
      }

      await this.onPlayerMoveSuccess();
    } else {
      // Event-Driven UI: Повідомляємо про помилку
      gameEventBus.dispatch('GAME_MOVE_FAILURE', {
        direction,
        distance,
        playerIndex: playerState.currentPlayerIndex,
        reason: moveResult.reason
      });
      await this.onPlayerMoveFailure(moveResult.reason, direction, distance);
    }
  }

  protected async onPlayerMoveSuccess(): Promise<void> {
    const playerState = get(playerStore);
    const currentPlayer = playerState!.players[playerState!.currentPlayerIndex];

    if (currentPlayer.type === 'human') {
      const settings = get(gameSettingsStore);
      if (settings.autoHideBoard) {
        gameEventBus.dispatch('UI_REQUEST_HIDE_BOARD', { delay: 0 });
      }
    }

    await this.advanceToNextPlayer();

    availableMovesService.updateAvailableMoves();
  }

  protected async onPlayerMoveFailure(reason: string | undefined, direction: MoveDirectionType, distance: number): Promise<void> {
    const boardState = get(boardStore);
    const playerState = get(playerStore);
    if (!boardState || !playerState) return;

    const piece = new Piece(boardState.playerRow!, boardState.playerCol!, boardState.boardSize);
    const finalInvalidPosition = piece.calculateNewPosition(direction, distance);

    const finalMoveForAnimation = {
      player: playerState.currentPlayerIndex + 1,
      direction: direction,
      distance: distance,
      to: finalInvalidPosition
    };

    boardStore.update(s => {
      if (!s) return null;
      const updatedMoveHistory = [...s.moveHistory, {
        pos: { row: finalInvalidPosition.row, col: finalInvalidPosition.col },
        blocked: [] as { row: number, col: number }[],
        visits: { ...s.cellVisitCounts },
        blockModeEnabled: get(gameSettingsStore).blockModeEnabled
      }];
      return {
        ...s,
        moveQueue: [...s.moveQueue, finalMoveForAnimation],
        moveHistory: updatedMoveHistory
      };
    });

    gameEventBus.dispatch('new_move_added', finalMoveForAnimation);

    if (reason === 'out_of_bounds') {
      await endGameService.endGame('modal.gameOverReasonOut');
    } else if (reason === 'blocked_cell') {
      await endGameService.endGame('modal.gameOverReasonBlocked');
    }
  }

  async restartGame(options: { newSize?: number } = {}): Promise<void> {
    this.initialize(options);
    this.initEngine();
    animationService.reset();
    gameEventBus.dispatch('CloseModal', undefined);
  }

  cleanup(): void {
    logService.GAME_MODE(`[${this.constructor.name}] cleanup called`);
    timeService.stopGameTimer();
    timeService.stopTurnTimer();
    uiStateStore.destroy();
    uiEffectsStore.destroy();
  }

  pauseTimers(): void {
    timeService.pauseGameTimer();
  }

  resumeTimers(): void {
    logService.GAME_MODE(`[${this.constructor.name}] Resuming timers.`);
    timeService.resumeGameTimer();
  }

  protected async triggerComputerMove(): Promise<void> {
    logService.GAME_MODE('triggerComputerMove: Початок ходу комп\'ютера.');
    uiStateStore.update(s => s ? ({ ...s, isComputerMoveInProgress: true }) : null);

    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const uiState = get(uiStateStore);
    if (!boardState || !playerState || !uiState) return;

    const computerMove = await aiService.getComputerMove(boardState, playerState, uiState);
    logService.GAME_MODE('triggerComputerMove: Результат getComputerMove:', computerMove);

    if (computerMove) {
      logService.GAME_MODE('triggerComputerMove: Комп\'ютер має хід, виконуємо...');
      const { direction, distance } = computerMove;

      // ЧОМУ: Консолідуємо логіку ввімкнення голосового керування.
      // Замість дублювання логіки та передчасного виклику, ми завжди використовуємо
      // onEndCallback, який спрацьовує після завершення анімації ходу комп'ютера.
      // Це гарантує, що розпізнавання мови не конфліктує з іншими UI-процесами.
      // Прапор voiceMoveRequested скидається тут, оскільки його призначення виконано.
      const onEndCallback = get(uiStateStore).voiceMoveRequested ? () => {
        logService.voiceControl('[triggerComputerMove] onEndCallback: Re-enabling voice control.');
        voiceControlService.startListening();
        uiStateStore.update(s => ({ ...s, voiceMoveRequested: false }));
      } : undefined;

      await this.handlePlayerMove(direction, distance, onEndCallback);
      // Set to false after successful move
      uiStateStore.update(s => s ? ({ ...s, isComputerMoveInProgress: false }) : null);
    } else {
      logService.GAME_MODE('triggerComputerMove: У комп\'ютера немає ходів, викликаємо handleNoMoves.');
      // Set to false before handling no moves
      uiStateStore.update(s => s ? ({ ...s, isComputerMoveInProgress: false }) : null);
      await this.handleNoMoves('computer');
    }

    // ВИДАЛЕНО: Цей блок викликав startListening() передчасно, до завершення анімації,
    // що призводило до негайного припинення розпізнавання.
    // if (get(uiStateStore).voiceMoveRequested) { ... }

    await tick();
  }
}