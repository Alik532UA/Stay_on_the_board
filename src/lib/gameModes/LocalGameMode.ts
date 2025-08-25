// src/lib/gameModes/LocalGameMode.ts
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { BaseGameMode } from './index';
import { gameState, type GameState, createInitialState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
import { gameStateMutator } from '$lib/services/gameStateMutator';
import * as gameLogicService from '$lib/services/gameLogicService';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { logService } from '$lib/services/logService';
import { animationService } from '$lib/services/animationService';
import { timeService } from '$lib/services/timeService';
import { noMovesService } from '$lib/services/noMovesService';
import { endGameService } from '$lib/services/endGameService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { tick } from 'svelte';
import { testModeStore } from '$lib/stores/testModeStore';
import { aiService } from '$lib/services/aiService';

export class LocalGameMode extends BaseGameMode {
  constructor() {
    super();
    this.turnDuration = 10; // 10 секунд на хід
  }

  initialize(options: { newSize?: number } = {}): void {
    const settings = get(settingsStore);
    const currentState = get(gameState);
    
    const players = currentState ? currentState.players : this.getPlayersConfiguration();
    
    const newInitialState = createInitialState({
      size: options.newSize ?? settings.boardSize,
      players: players,
      testMode: get(testModeStore).isEnabled
    });
    const moves = availableMovesService.getAvailableMoves(newInitialState);
    newInitialState.availableMoves = moves;
    
    gameState.set(newInitialState);
    
    animationService.initialize();
    this.checkComputerTurn();
    this.startTurn();
  }

  private _handleLocalNoMoves(): void {
    noMovesService.dispatchNoMovesEvent('human');
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);

    gameStateMutator.resetForNoMovesContinue(true);

    const updated = get(gameState);
    logService.logicAvailability('[LocalGameMode] availableMoves after continue:', updated?.availableMoves || []);

    gameOverStore.resetGameOverState();
    animationService.reset();
    
    await this.checkComputerTurn();
    this.startTurn();
    gameEventBus.dispatch('CloseModal');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    if (playerType === 'human') {
      this._handleLocalNoMoves();
    } else {
      logService.GAME_MODE('handleNoMoves for computer is not applicable in LocalGameMode');
    }
  }

  getPlayersConfiguration(): Player[] {
    return get(gameState).players;
  }

  protected async advanceToNextPlayer(): Promise<void> {
    const currentState = get(gameState);
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    if (nextPlayerIndex === 0) {
      gameStateMutator.snapshotScores();
    }

    gameStateMutator.setCurrentPlayer(nextPlayerIndex);

    await this.checkComputerTurn();
    this.startTurn();
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    const { bonusPoints, penaltyPoints } = scoreChanges;
    const state = get(gameState);
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (bonusPoints > 0) {
      gameStateMutator.addPlayerBonus(currentPlayer.id, bonusPoints);
    }
    if (penaltyPoints > 0) {
      gameStateMutator.addPlayerPenalty(currentPlayer.id, penaltyPoints);
    }
  }

  private async checkComputerTurn(): Promise<void> {
    const state = get(gameState);
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.type === 'computer') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const move = aiService.getComputerMove();
      if (move) {
        await this.handlePlayerMove(move.direction, move.distance);
      } else {
        await endGameService.endGame('modal.gameOverReasonPlayerBlocked');
      }
    }
  }

  cleanup(): void {
    super.cleanup();
  }
}