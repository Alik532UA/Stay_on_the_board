import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
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

  abstract initialize(options?: { newSize?: number }): void;

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

  abstract handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;

  abstract getPlayersConfiguration(): Player[];

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);
    
    gameState.update(state => {
        if (!state) return null;

        const settings = get(settingsStore);
        const bonus = state.boardSize;

        // Створюємо проміжний стан з очищеною дошкою
        const intermediateState = {
            ...state,
            noMovesBonus: (state.noMovesBonus || 0) + bonus,
            cellVisitCounts: {},
            moveHistory: [{
                pos: { row: state.playerRow, col: state.playerCol },
                blocked: [] as {row: number, col: number}[],
                visits: {},
                blockModeEnabled: settings.blockModeEnabled
            }],
            moveQueue: [] as any[],
            noMovesClaimed: false,
            isComputerMoveInProgress: false,
            isResumedGame: true,
            isNewGame: false,
            isGameOver: false,
            gameOverReasonKey: null as (string | null)
        };

        // Розраховуємо нові ходи на основі чистого стану
        const newAvailableMoves = availableMovesService.getAvailableMoves(intermediateState);

        // Повертаємо фінальний оновлений стан
        return {
            ...intermediateState,
            availableMoves: newAvailableMoves
        };
    });
    
    gameOverStore.resetGameOverState();
    animationService.reset();
    gameEventBus.dispatch('CloseModal');
  }
  protected abstract advanceToNextPlayer(): Promise<void>;
  protected abstract applyScoreChanges(scoreChanges: any): Promise<void>;

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
    // НАВІЩО: Гарантуємо, що стан анімації скидається разом з ігровим станом.
    // Це усуває розсинхронізацію між логікою та візуалізацією.
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
}