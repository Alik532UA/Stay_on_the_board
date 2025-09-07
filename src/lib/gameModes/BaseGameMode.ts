// src/lib/gameModes/BaseGameMode.ts
import { get } from 'svelte/store';
import { tick } from 'svelte';
import { aiService } from '$lib/services/aiService';
import type { IGameMode } from './gameMode.interface';
import type { Player } from '$lib/models/player';
import * as gameLogicService from '$lib/services/gameLogicService';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import { Piece, type MoveDirectionType } from '../models/Piece';
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
import { voiceControlService } from '$lib/services/voiceControlService';

export abstract class BaseGameMode implements IGameMode {
  public turnDuration: number = 0;
  public gameDuration: number = 0;

  abstract getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player';
  abstract initialize(options?: { newSize?: number }): void;
  abstract handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;
  abstract getPlayersConfiguration(): Player[];
  protected abstract advanceToNextPlayer(): Promise<void>;
  protected abstract applyScoreChanges(scoreChanges: any): Promise<void>;
  abstract continueAfterNoMoves(): Promise<void>;

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
    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);
    const uiState = get(uiStateStore);
    const settings = get(gameSettingsStore);

    const combinedState = { ...boardState, ...playerState, ...scoreState, ...uiState };

    const moveResult = gameLogicService.performMove(direction, distance, playerState!.currentPlayerIndex, combinedState, settings, onEndCallback);

    if (moveResult.success) {
      boardStore.update(s => s ? ({ ...s, ...moveResult.changes.boardState }) : null);
      playerStore.update(s => s ? ({ ...s, ...moveResult.changes.playerState }) : null);
      scoreStore.update(s => s ? ({ ...s, ...moveResult.changes.scoreState }) : null);
      uiStateStore.update(s => s ? ({ ...s, ...moveResult.changes.uiState }) : null);
      
      const newMove = moveResult.changes.boardState.moveQueue.slice(-1)[0];
      if (newMove) {
        gameEventBus.dispatch('new_move_added', newMove);
      }

      await this.applyScoreChanges(moveResult);
      await this.onPlayerMoveSuccess(moveResult);
    } else {
      if (moveResult.changes && moveResult.changes.boardState) {
        boardStore.update(s => s ? ({ ...s, ...moveResult.changes.boardState }) : null);
      }
      await this.onPlayerMoveFailure(moveResult.reason, direction, distance);
    }
  }

  protected async onPlayerMoveSuccess(moveResult: any): Promise<void> {
    uiStateStore.update(s => s ? ({ ...s, selectedDirection: null, selectedDistance: null, isFirstMove: false }) : null);
    
    if (moveResult.sideEffects && moveResult.sideEffects.length > 0) {
      logService.GAME_MODE('[BaseGameMode] Executing side effects for move...', moveResult.sideEffects);
      moveResult.sideEffects.forEach((effect: SideEffect) => sideEffectService.execute(effect));
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
        blocked: [] as {row: number, col: number}[],
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
    animationService.reset();
    gameEventBus.dispatch('CloseModal');
  }
  
  cleanup(): void {
    logService.GAME_MODE(`[${this.constructor.name}] cleanup called`);
    timeService.stopGameTimer();
    timeService.stopTurnTimer();
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

    const computerMove = aiService.getComputerMove(boardState, playerState, uiState);
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