import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { tick } from 'svelte';
import { aiService } from '$lib/services/aiService';
import type { IGameMode } from './gameMode.interface';
import { gameState, type GameState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
import { gameStateMutator } from '$lib/services/gameStateMutator';
import * as gameLogicService from '$lib/services/gameLogicService';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { logService } from '$lib/services/logService';
import { animationService } from '$lib/services/animationService';
import { endGameService } from '$lib/services/endGameService';
import { noMovesService } from '$lib/services/noMovesService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { timeService } from '$lib/services/timeService';

export abstract class BaseGameMode implements IGameMode {
  public turnDuration: number = 0; // Default to 0, means no timer
  public gameDuration: number = 0; // Default to 0, means no timer

  // Abstract methods to be implemented by subclasses
  abstract initialize(options?: { newSize?: number }): void;
  abstract handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;
  abstract getPlayersConfiguration(): Player[];
  protected abstract advanceToNextPlayer(): Promise<void>;
  protected abstract applyScoreChanges(scoreChanges: any): Promise<void>;

  // Common implemented methods
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

  abstract continueAfterNoMoves(): Promise<void>;

  async handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<void> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

    if (moveResult.success) {
      gameStateMutator.applyMove(moveResult.changes);
      await this.applyScoreChanges(moveResult);
      await this.onPlayerMoveSuccess(moveResult);
    } else {
      if (moveResult.changes) {
        gameStateMutator.applyMove(moveResult.changes);
      }
      await this.onPlayerMoveFailure(moveResult.reason, direction, distance);
    }
  }

  protected async onPlayerMoveSuccess(moveResult: any): Promise<void> {
    const currentState = get(gameState);
    const stateUpdate: Partial<GameState> = {};

    if (currentState.isNewGame) {
      stateUpdate.isNewGame = false;
    }
    if (currentState.isResumedGame) {
      stateUpdate.isResumedGame = false;
    }

    stateUpdate.selectedDirection = null;
    stateUpdate.selectedDistance = null;

    if (Object.keys(stateUpdate).length > 0) {
      gameStateMutator.applyMove(stateUpdate);
    }

    await this.advanceToNextPlayer();

    const updatedState = get(gameState);
    if (updatedState) {
      const moves = availableMovesService.getAvailableMoves(updatedState);
      gameStateMutator.applyMove({ availableMoves: moves });
    }
    
    if (moveResult.sideEffects && moveResult.sideEffects.length > 0) {
      moveResult.sideEffects.forEach((effect: SideEffect) => sideEffectService.execute(effect));
    }
  }

  protected async onPlayerMoveFailure(reason: string | undefined, direction: MoveDirectionType, distance: number): Promise<void> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const figure = new Figure(state.playerRow!, state.playerCol!, state.boardSize);
    const finalInvalidPosition = figure.calculateNewPosition(direction, distance);

    const finalMoveForAnimation = {
      player: 1,
      direction: direction,
      distance: distance,
      to: finalInvalidPosition
    };
    
    const updatedMoveHistory = [...state.moveHistory, {
      pos: { row: finalInvalidPosition.row, col: finalInvalidPosition.col },
      blocked: [] as {row: number, col: number}[],
      visits: { ...state.cellVisitCounts },
      blockModeEnabled: settings.blockModeEnabled
    }];

    gameStateMutator.applyMove({
      moveQueue: [...state.moveQueue, finalMoveForAnimation],
      moveHistory: updatedMoveHistory
    });

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
    timeService.stopTurnTimer();
    timeService.stopGameTimer();
  }

  pauseTimers(): void {
    timeService.pauseGameTimer();
  }

  resumeTimers(): void {
    timeService.resumeGameTimer();
  }

  protected async triggerComputerMove(): Promise<void> {
    logService.GAME_MODE('triggerComputerMove: Початок ходу комп\'ютера.');
    gameStateMutator.applyMove({ isComputerMoveInProgress: true });

    const computerMove = aiService.getComputerMove();
    logService.GAME_MODE('triggerComputerMove: Результат getComputerMove:', computerMove);

    if (computerMove) {
      logService.GAME_MODE('triggerComputerMove: Комп\'ютер має хід, виконуємо...');
      const { direction, distance } = computerMove;
      await this.handlePlayerMove(direction, distance);
    } else {
      logService.GAME_MODE('triggerComputerMove: У комп\'ютера немає ходів, викликаємо handleNoMoves.');
      await this.handleNoMoves('computer');
    }
    await tick();
    gameStateMutator.applyMove({ isComputerMoveInProgress: false });
  }
}