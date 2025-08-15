import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { BaseGameMode } from './index';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { stateManager } from '$lib/services/stateManager';
import { userActionService } from '$lib/services/userActionService';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { logService } from '$lib/services/logService';
import { lastPlayerMove } from '$lib/stores/derivedState';

export class LocalGameMode extends BaseGameMode {
  initialize(initialState: GameState): void {
    // Initialization for local games is handled in the `local-setup` page.
    this.checkComputerTurn();
  }

  async claimNoMoves(): Promise<SideEffect[]> {
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
      // If moves are available, the player loses.
      const currentPlayerName = state.players[state.currentPlayerIndex].name;
      return this.endGame('modal.gameOverReasonPlayerLied', { playerName: currentPlayerName });
    } else {
      // If there are no moves, show the modal.
      return this._handleLocalNoMoves();
    }
  }

  private _handleLocalNoMoves(): SideEffect[] {
    const state = get(gameState);
    const currentPlayerName = state.players[state.currentPlayerIndex].name;

    return [
      {
        type: 'ui/showModal',
        payload: {
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
        }
      }
    ];
  }

  private async _continueLocalGameAfterNoMoves(): Promise<SideEffect[]> {
    await stateManager.applyChanges(
      'CONTINUE_LOCAL_GAME',
      { cellVisitCounts: {} },
      'Clearing blocked cells and continuing local game'
    );
    this.advanceToNextPlayer();
    return [{ type: 'ui/closeModal' }];
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<SideEffect[]> {
    logService.logic('handleNoMoves is not applicable in LocalGameMode');
    return [];
  }

  getPlayersConfiguration(): Player[] {
    // Player configuration is now directly in gameState
    return get(gameState).players;
  }



  protected async advanceToNextPlayer(): Promise<SideEffect[]> {
    const currentState = get(gameState);
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    if (nextPlayerIndex === 0) {
      gameState.snapshotScores();
    }

    await stateManager.applyChanges(
      'ADVANCE_TURN',
      { currentPlayerIndex: nextPlayerIndex },
      `Turn advanced to player ${nextPlayerIndex}`
    );

    return this.checkComputerTurn();
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    const { bonusPoints, penaltyPoints } = scoreChanges;
    const state = get(gameState);
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (bonusPoints > 0) {
      gameState.addPlayerBonusPoints(currentPlayer.id, bonusPoints);
    }
    if (penaltyPoints > 0) {
      gameState.addPlayerPenaltyPoints(currentPlayer.id, penaltyPoints);
    }
  }

  private async checkComputerTurn(): Promise<SideEffect[]> {
    const state = get(gameState);
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.type === 'computer') {
      // Додаємо невелику затримку для імітації "роздумів" комп'ютера
      await new Promise(resolve => setTimeout(resolve, 1000));

      const move = gameLogicService.getComputerMove();
      if (move) {
        return this.handlePlayerMove(move.direction, move.distance);
      } else {
        // Якщо комп'ютер не може зробити хід, це означає кінець гри для нього
        return this.endGame('modal.gameOverReasonPlayerBlocked');
      }
    }
    return [];
  }
}