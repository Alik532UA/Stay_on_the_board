import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { BaseGameMode } from './BaseGameMode';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { stateManager } from '$lib/services/stateManager';
import { modalStore } from '$lib/stores/modalStore';
import { gameOrchestrator } from '$lib/gameOrchestrator';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { localGameStore } from '$lib/stores/localGameStore';
import { logService } from '$lib/services/logService';
import { lastPlayerMove } from '$lib/stores/derivedState';
export class LocalGameMode extends BaseGameMode {
  initialize(initialState: GameState): void {
    // Ініціалізація для локальної гри відбувається в `local-setup`
    this.checkComputerTurn();
  }

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
      // Якщо ходи є, гравець програв
      const currentPlayerName = state.players[state.currentPlayerIndex].name;
      this.endGame('modal.gameOverReasonPlayerLied', { playerName: currentPlayerName });
    } else {
      // Якщо ходів немає, показуємо модальне вікно
      this._handleLocalNoMoves();
    }
  }

  private _handleLocalNoMoves(): void {
    const state = get(gameState);
    const currentPlayerName = state.players[state.currentPlayerIndex].name;

    modalStore.showModal({
      titleKey: 'modal.playerNoMovesTitle',
      contentKey: 'modal.noMovesLocalGameContent',
      content: { playerName: currentPlayerName },
      buttons: [
        {
          textKey: 'modal.continueGame',
          onClick: () => this._continueLocalGameAfterNoMoves(),
          primary: true,
          isHot: true
        },
        {
          textKey: 'modal.endGame',
          onClick: () => this.endGame('modal.gameOverReasonNoMovesLeft')
        },
        {
          textKey: 'modal.reviewRecord',
          customClass: 'blue-btn',
          onClick: () => gameOrchestrator.requestReplay()
        }
      ]
    });
  }

  private async _continueLocalGameAfterNoMoves(): Promise<void> {
    await stateManager.applyChanges(
      'CONTINUE_LOCAL_GAME',
      { cellVisitCounts: {} },
      'Clearing blocked cells and continuing local game'
    );
    modalStore.closeModal();
    this.advanceToNextPlayer();
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.logic('handleNoMoves is not applicable in LocalGameMode');
  }

  getPlayersConfiguration(): Player[] {
    return get(localGameStore).players.map(p => ({
      id: p.id,
      name: p.name,
      type: p.isComputer ? 'computer' : 'human',
      score: p.score
    }));
  }

  public determineWinner(state: GameState, reasonKey: string) {
    const localGameState = get(localGameStore);
    const scores = localGameState.scoresAtRoundStart;

    // Якщо гра завершилася через те, що гравець здався (бо немає ходів),
    // переможець визначається за балами серед УСІХ гравців.
    // В інших випадках (вихід за поле, неправдива заява), поточний гравець програє.
    const isNoMovesSurrender = reasonKey === 'modal.gameOverReasonNoMovesLeft';
    const losingPlayerIndex = isNoMovesSurrender ? -1 : state.currentPlayerIndex;

    let maxScore = -Infinity;
    // Визначаємо максимальний рахунок
    for (let i = 0; i < scores.length; i++) {
      if (i !== losingPlayerIndex) { // Виключаємо гравця, що програв, якщо такий є
        if (scores[i] > maxScore) {
          maxScore = scores[i];
        }
      }
    }

    // Знаходимо всіх гравців з максимальним рахунком
    const winners: number[] = [];
    for (let i = 0; i < scores.length; i++) {
      if (i !== losingPlayerIndex && scores[i] === maxScore) {
        winners.push(i);
      }
    }
    
    // Якщо переможців немає (наприклад, всі програли одночасно, хоча це малоймовірно),
    // то переможців немає.
    const winningPlayerIndex = winners.length > 0 ? winners[0] : -1;
    return { winners, winningPlayerIndex };
  }

  public createGameOverModalContent(reasonKey: string, reasonValues: Record<string, any> | null, finalScoreDetails: FinalScoreDetails, state: GameState) {
    const localGameState = get(localGameStore);
    const losingPlayerIndex = state.currentPlayerIndex;
    const losingPlayerName = localGameState.players[losingPlayerIndex].name;
    const { winners, winningPlayerIndex } = this.determineWinner(state, reasonKey);

    const modalReason = get(_)(reasonKey, { values: { playerName: losingPlayerName } });

    const playerScores = localGameState.players.map((player, index) => ({
      playerNumber: index + 1,
      playerName: player.name,
      score: localGameState.scoresAtRoundStart[index],
      isWinner: winners.includes(index),
      isLoser: index === losingPlayerIndex
    }));

    let titleKey = 'modal.gameOverTitle';
    let winnerName = '';
    let winnerNumbers = '';

    if (winners.length === 1) {
      titleKey = 'modal.winnerTitle';
      winnerName = localGameState.players[winningPlayerIndex].name;
    } else if (winners.length > 1) {
      titleKey = 'modal.winnersTitle';
      winnerNumbers = winners.map(i => localGameState.players[i].name).join(', ');
    }

    return {
      titleKey,
      content: {
        reason: modalReason,
        playerScores,
        winnerName,
        winnerNumbers,
        scoreDetails: finalScoreDetails
      }
    };
  }

  protected async advanceToNextPlayer(): Promise<void> {
    const currentState = get(gameState);
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    // Якщо починається нове коло, робимо знімок рахунків
    if (nextPlayerIndex === 0) {
      localGameStore.snapshotScores();
    }

    await stateManager.applyChanges(
      'ADVANCE_TURN',
      { currentPlayerIndex: nextPlayerIndex },
      `Turn advanced to player ${nextPlayerIndex}`
    );

    // Оновлення availableMoves тепер відбувається реактивно через derived store

    this.checkComputerTurn();
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
        this.endGame('modal.gameOverReasonPlayerBlocked');
      }
    }
  }
}