import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import type { IGameMode } from './gameMode.interface';
import { gameState, type GameState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
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
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { animationStore } from '$lib/stores/animationStore';

export abstract class BaseGameMode implements IGameMode {
  /**
   * Initializes the game mode with a given state.
   * @param initialState The initial state of the game.
   */
  abstract initialize(initialState: GameState): void;

  /**
   * Handles the player's claim that there are no available moves.
   * If moves are available, the game ends. Otherwise, it proceeds to the no-moves handling logic.
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
      settings.blockModeEnabled,
      null
    );

    if (Object.keys(availableMoves).length > 0) {
      const currentPlayerName = state.players[state.currentPlayerIndex].name;
      await this.endGame('modal.gameOverReasonPlayerLied', { playerName: currentPlayerName });
    } else {
      await this.handleNoMoves('human');
    }
  }

  /**
   * Handles the situation where there are no available moves for a player.
   * @param playerType The type of player ('human' or 'computer').
   */
  abstract handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;

  /**
   * Gets the player configuration for the specific game mode.
   * @returns An array of Player objects.
   */
  abstract getPlayersConfiguration(): Player[];

  /**
   * Continues the game after a no-moves situation has been resolved (e.g., by clearing the board).
   */
  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);
    const state = get(gameState);
    const settings = get(settingsStore);
    const bonus = state.boardSize;

    const continueChanges = {
      noMovesBonus: (state.noMovesBonus || 0) + bonus,
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
      isGameOver: false,
      gameOverReasonKey: null as string | null,
      gameOverReasonValues: null as Record<string, any> | null
    };

    gameStateMutator.applyMove(continueChanges);
    
    gameOverStore.resetGameOverState();
    animationStore.reset();

    await this.advanceToNextPlayer();
    gameEventBus.dispatch('CloseModal');
  }
  protected abstract advanceToNextPlayer(): Promise<void>;
  protected abstract applyScoreChanges(scoreChanges: any): Promise<void>;

  /**
   * Processes a player's move.
   * @param direction The direction of the move.
   * @param distance The distance of the move.
   */
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

  protected _dispatchNoMovesEvent(playerType: 'human' | 'computer') {
    const state = get(gameState);
    const scoreDetails = calculateFinalScore(state as any, 'vs-computer');
    gameEventBus.dispatch('ShowNoMovesModal', {
      playerType,
      scoreDetails,
      boardSize: state.boardSize
    });
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

  /**
   * Restarts the game.
   */
  async restartGame(): Promise<void> {
    gameStateMutator.resetGame();
    gameEventBus.dispatch('CloseModal');
  }
  
  /**
   * Cleans up any resources or subscriptions when the game mode is destroyed.
   */
  cleanup(): void {
    logService.GAME_MODE(`[${this.constructor.name}] cleanup called`);
  }
}