import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import type { IGameMode } from './gameMode.interface';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService';
import { calculateFinalScore, determineWinner } from '$lib/services/scoreService';
import { playerInputStore, initialState } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { userActionService } from '$lib/services/userActionService';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { logService } from '$lib/services/logService';

export abstract class BaseGameMode implements IGameMode {
  abstract initialize(initialState: GameState): void;
  abstract claimNoMoves(): Promise<SideEffect[]>;
  abstract handleNoMoves(playerType: 'human' | 'computer'): Promise<SideEffect[]>;
  abstract getPlayersConfiguration(): Player[];
  abstract continueAfterNoMoves(): Promise<SideEffect[]>;
  protected abstract advanceToNextPlayer(): Promise<SideEffect[]>;
  protected abstract applyScoreChanges(scoreChanges: any): Promise<void>;

  async handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<SideEffect[]> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

    if (moveResult.success) {
      await this.applyScoreChanges(moveResult);
      return this.onPlayerMoveSuccess(moveResult);
    } else {
      return this.onPlayerMoveFailure(moveResult.reason, direction, distance);
    }
  }

  protected async onPlayerMoveSuccess(moveResult: any): Promise<SideEffect[]> {
    const currentState = get(gameState);
    if (currentState.isFirstMove) {
      gameState.update(state => ({...state, isFirstMove: false}));
    }
    if (currentState.wasResumed) {
      gameState.update(state => ({...state, wasResumed: false}));
    }

    playerInputStore.set(initialState);

    const nextPlayerEffects = await this.advanceToNextPlayer();
    
    // Перевіряємо, чи є у moveResult побічні ефекти (наприклад, модальне вікно)
    const moveResultEffects = moveResult.sideEffects || [];

    return [...moveResultEffects, ...nextPlayerEffects];
  }

  protected async onPlayerMoveFailure(reason: string | undefined, direction: MoveDirectionType, distance: number): Promise<SideEffect[]> {
    const state = get(gameState);
    const figure = new Figure(state.playerRow!, state.playerCol!, state.boardSize);
    const finalInvalidPosition = figure.calculateNewPosition(direction, distance);

    const finalMoveForAnimation = {
      player: 1,
      direction: direction,
      distance: distance,
      to: finalInvalidPosition
    };

    gameState.update(state => ({...state, moveQueue: [...state.moveQueue, finalMoveForAnimation]}));

    if (reason === 'out_of_bounds') {
      return this.endGame('modal.gameOverReasonOut');
    } else if (reason === 'blocked_cell') {
      return this.endGame('modal.gameOverReasonBlocked');
    }
    return [];
  }

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<SideEffect[]> {
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
    gameState.update(state => ({...state, ...endGameChanges}));

    const { winners } = determineWinner(state, reasonKey);
    gameOverStore.setGameOver({
      scores: state.players.map(p => ({ playerId: p.id, score: p.score })),
      winners: winners,
      reasonKey,
      reasonValues,
      finalScoreDetails,
      gameType: gameType,
    });

    sideEffectService.execute({
      type: 'ui/showGameOverModal',
      payload: {
        reasonKey,
        reasonValues,
        finalScoreDetails,
        gameType,
        state
      }
    });

    return [];
  }

  async restartGame(): Promise<SideEffect[]> {
    gameLogicService.resetGame({}, get(gameState));
    return [{ type: 'ui/closeModal' }];
  }
  
  cleanup(): void {
    logService.GAME_MODE(`[${this.constructor.name}] cleanup called`);
  }
}