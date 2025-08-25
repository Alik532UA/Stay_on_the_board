// src/lib/gameModes/TrainingGameMode.ts
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { _, locale } from 'svelte-i18n';
import { BaseGameMode } from './BaseGameMode';
import { moveDirections } from '$lib/utils/translations';
import { lastComputerMove, availableMoves as derivedAvailableMoves } from '$lib/stores/derivedState';
import { gameState, type GameState, createInitialState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
import { gameStateMutator } from '$lib/services/gameStateMutator';
import * as gameLogicService from '$lib/services/gameLogicService';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { userActionService } from '$lib/services/userActionService';
import { gameEventBus } from '$lib/services/gameEventBus';
import type { SideEffect } from '$lib/services/sideEffectService';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { logService } from '$lib/services/logService';
import { calculateFinalScore } from '$lib/services/scoreService';
import { animationService } from '$lib/services/animationService';
import { noMovesService } from '$lib/services/noMovesService';
import { endGameService } from '$lib/services/endGameService';
import { timeService } from '$lib/services/timeService';
import { gameStore } from '$lib/stores/gameStore';
import { availableMovesService } from '$lib/services/availableMovesService';
import { testModeStore } from '$lib/stores/testModeStore';
import { aiService } from '$lib/services/aiService';
import { getInitialPosition } from '$lib/utils/initialPositionUtils';

export class TrainingGameMode extends BaseGameMode {
  initialize(options: { newSize?: number } = {}): void {
    const currentSize = get(gameState)?.boardSize;
    const size = options.newSize ?? currentSize ?? 4;
    const testModeState = get(testModeStore);
    
    const initialPosition = getInitialPosition(size, testModeState);

    const newInitialState = createInitialState({
      size,
      players: this.getPlayersConfiguration(),
      testMode: testModeState.isEnabled,
      initialPosition
    });
    const moves = availableMovesService.getAvailableMoves(newInitialState);
    newInitialState.availableMoves = moves;
    
    gameState.set(newInitialState);
    
    animationService.initialize();
    this.startTurn();
  }

  async claimNoMoves(): Promise<void> {
    await super.claimNoMoves();
  }

  getPlayersConfiguration(): Player[] {
    return [
      { id: 1, type: 'human', name: 'Гравець', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0, color: '#457b9d', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
    ];
  }

  public determineWinner(state: GameState, reasonKey: string) {
    return { winners: [] as number[], winningPlayerIndex: -1 };
  }


  protected async advanceToNextPlayer(): Promise<void> {
    logService.GAME_MODE('advanceToNextPlayer: Передача ходу наступному гравцю.');
    const currentState = get(gameState);
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    gameStateMutator.setCurrentPlayer(nextPlayerIndex);

    const nextPlayer = get(gameState).players[nextPlayerIndex];
    logService.GAME_MODE(`advanceToNextPlayer: Наступний гравець: ${nextPlayer.type}.`);
    if (nextPlayer.type === 'ai' && !get(gameState).isComputerMoveInProgress) {
      logService.GAME_MODE('advanceToNextPlayer: Запуск ходу комп\'ютера.');
      await this.triggerComputerMove();
    } else {
      this.startTurn();
    }
  }


  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    // No specific score changes to apply in training mode
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);
    gameStateMutator.resetForNoMovesContinue(false);
    
    gameOverStore.resetGameOverState();
    animationService.reset();
    this.startTurn();
    gameEventBus.dispatch('CloseModal');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.GAME_MODE(`handleNoMoves: Обробка ситуації "немає ходів" для гравця типу: ${playerType}.`);
    const state = get(gameState);
    gameOverStore.resetGameOverState();

    gameStateMutator.applyMove({
      noMovesClaimed: true,
      noMovesBonus: (state.noMovesBonus || 0) + state.boardSize
    });

    noMovesService.dispatchNoMovesEvent(playerType);
  }

  protected startTurn(): void {
    timeService.stopTurnTimer();
  }

  cleanup(): void {
    super.cleanup();
  }
}