import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import type { IGameMode } from './gameMode.interface';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import { gameStateMutator } from '$lib/services/gameStateMutator';
import * as gameLogicService from '$lib/services/gameLogicService';
import { calculateFinalScore, determineWinner } from '$lib/services/scoreService';
import { playerInputStore, initialState } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { userActionService } from '$lib/services/userActionService';
import { gameEventBus } from '$lib/services/gameEventBus';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { logService } from '$lib/services/logService';

export abstract class BaseGameMode implements IGameMode {
  abstract initialize(initialState: GameState): void;
  abstract claimNoMoves(): Promise<void>;
  abstract handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;
  abstract getPlayersConfiguration(): Player[];
  abstract continueAfterNoMoves(): Promise<void>;
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
      // невдалий хід також може мати зміни стану (наприклад, історія ходів)
      if (moveResult.changes) {
        gameStateMutator.applyMove(moveResult.changes);
      }
      await this.onPlayerMoveFailure(moveResult.reason, direction, distance);
    }
  }

  protected async onPlayerMoveSuccess(moveResult: any): Promise<void> {
    const currentState = get(gameState);
    if (currentState.isFirstMove) {
      gameStateMutator.applyMove({ isFirstMove: false });
    }
    if (currentState.wasResumed) {
      gameStateMutator.applyMove({ wasResumed: false });
    }

    playerInputStore.set(initialState);

    await this.advanceToNextPlayer();
    
    // Побічні ефекти з moveResult (якщо є) тепер мають відправлятися через gameEventBus
    // всередині gameLogicService або тут, якщо це логіка режиму гри.
    // Наразі `performMove` не повертає sideEffects, тому цей код можна видалити.
    if (moveResult.sideEffects && moveResult.sideEffects.length > 0) {
      moveResult.sideEffects.forEach((effect: SideEffect) => sideEffectService.execute(effect)); // Тимчасовий воркраунд
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
      await this.endGame('modal.gameOverReasonOut');
    } else if (reason === 'blocked_cell') {
      await this.endGame('modal.gameOverReasonBlocked');
    }
  }

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] endGame called with reason:`, reasonKey);
    const state = get(gameState);
    const humanPlayersCount = get(gameState).players.filter(p => p.type === 'human').length;
    const gameType = humanPlayersCount > 1 ? 'local' : 'vs-computer';
    const finalScoreDetails = calculateFinalScore(state as any, gameType);

    const endGameChanges = {
      isGameOver: true,
      gameOverReasonKey: reasonKey,
      gameOverReasonValues: reasonValues,
    };
    gameStateMutator.setGameOver(reasonKey, reasonValues);

    const { winners } = determineWinner(state, reasonKey);
    gameOverStore.setGameOver({
      scores: state.players.map(p => ({ playerId: p.id, score: p.score })),
      winners: winners,
      reasonKey,
      reasonValues,
      finalScoreDetails,
      gameType: gameType,
    });

    gameEventBus.dispatch('GameOver', {
      reasonKey,
      reasonValues,
      finalScoreDetails,
      gameType,
      state
    });
  }

  async restartGame(): Promise<void> {
    gameStateMutator.resetGame();
    gameEventBus.dispatch('CloseModal');
  }
  
  cleanup(): void {
    logService.GAME_MODE(`[${this.constructor.name}] cleanup called`);
  }
}