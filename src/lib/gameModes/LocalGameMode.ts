import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { BaseGameMode } from './index';
import { gameState, type GameState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
import { gameStateMutator } from '$lib/services/gameStateMutator';
import * as gameLogicService from '$lib/services/gameLogicService';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { userActionService } from '$lib/services/userActionService';
import { gameEventBus } from '$lib/services/gameEventBus';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { logService } from '$lib/services/logService';
import { lastPlayerMove } from '$lib/stores/derivedState';
import { animationStore } from '$lib/stores/animationStore';

export class LocalGameMode extends BaseGameMode {
  initialize(initialState: GameState): void {
    // Initialization for local games is handled in the `local-setup` page.
    this.checkComputerTurn();
  }

  async claimNoMoves(): Promise<void> {
    await super.claimNoMoves();
  }

  private _handleLocalNoMoves(): void {
    const state = get(gameState);
    const currentPlayerName = state.players[state.currentPlayerIndex].name;

    gameEventBus.dispatch('ShowModal', {
      titleKey: 'modal.playerNoMovesTitle',
      contentKey: 'modal.noMovesLocalGameContent',
      content: { playerName: currentPlayerName },
      buttons: [
        {
          textKey: 'modal.continueGame',
          onClick: () => userActionService.handleModalAction('continueAfterNoMoves'),
          primary: true,
          isHot: true,
          dataTestId: 'continue-game-btn'
        },
        {
          textKey: 'modal.endGame',
          onClick: () => userActionService.handleModalAction('finishWithBonus', { reasonKey: 'modal.gameOverReasonNoMovesLeft' }),
          dataTestId: 'end-game-btn'
        },
        {
          textKey: 'modal.reviewRecord',
          customClass: 'blue-btn',
          onClick: () => userActionService.handleModalAction('requestReplay'),
          dataTestId: 'review-record-btn'
        }
      ]
    });
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE('[LocalGameMode] continueAfterNoMoves called');
    gameStateMutator.clearCellVisits();
    animationStore.reset();
    await this.advanceToNextPlayer();
    gameEventBus.dispatch('CloseModal');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.GAME_MODE('handleNoMoves is not applicable in LocalGameMode');
  }

  getPlayersConfiguration(): Player[] {
    // Player configuration is now directly in gameState
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
      // Додаємо невелику затримку для імітації "роздумів" комп'ютера
      await new Promise(resolve => setTimeout(resolve, 1000));

      const move = gameLogicService.getComputerMove();
      if (move) {
        await this.handlePlayerMove(move.direction, move.distance);
      } else {
        // Якщо комп'ютер не може зробити хід, це означає кінець гри для нього
        await this.endGame('modal.gameOverReasonPlayerBlocked');
      }
    }
  }
}