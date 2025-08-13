import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import type { IGameMode } from './gameMode.interface';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { stateManager } from '$lib/services/stateManager';
import { modalStore } from '$lib/stores/modalStore';
import { gameOrchestrator } from '$lib/gameOrchestrator';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { logService } from '$lib/services/logService';

export abstract class BaseGameMode implements IGameMode {
  abstract initialize(initialState: GameState): void;
  abstract claimNoMoves(): Promise<void>;
  abstract handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;
  abstract getPlayersConfiguration(): Player[];
  public abstract determineWinner(state: GameState, reasonKey: string): { winners: number[], winningPlayerIndex: number };
  public abstract createGameOverModalContent(reasonKey: string, reasonValues: Record<string, any> | null, finalScoreDetails: FinalScoreDetails, state: GameState): any;
  protected abstract advanceToNextPlayer(): Promise<void>;

  async handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<void> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

    if (moveResult.success) {
      this.onPlayerMoveSuccess(moveResult);
    } else {
      this.onPlayerMoveFailure(moveResult.reason, direction, distance);
    }
  }

  protected async onPlayerMoveSuccess(moveResult: any): Promise<void> {
    const currentState = get(gameState);
    if (currentState.isFirstMove) {
      await stateManager.applyChanges('FIRST_MOVE_COMPLETED', { isFirstMove: false }, 'First move completed');
    }
    if (currentState.wasResumed) {
      await stateManager.applyChanges('RESET_WAS_RESUMED', { wasResumed: false }, 'Resetting wasResumed after successful player move');
    }

    playerInputStore.set({
      selectedDirection: null,
      selectedDistance: null,
      distanceManuallySelected: false,
      isMoveInProgress: false
    });

    this.advanceToNextPlayer();
  }

  protected async onPlayerMoveFailure(reason: string | undefined, direction: MoveDirectionType, distance: number): Promise<void> {
    const state = get(gameState);
    const figure = new Figure(state.playerRow!, state.playerCol!, state.boardSize);
    const finalInvalidPosition = figure.calculateNewPosition(direction, distance);

    const finalMoveForAnimation = {
      player: 1,
      direction: direction,
      distance: distance,
      to: finalInvalidPosition
    };

    await stateManager.applyChanges(
      'QUEUE_FINAL_MOVE',
      { moveQueue: [...state.moveQueue, finalMoveForAnimation] },
      'Queueing final losing move for animation'
    );

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (reason === 'out_of_bounds') {
      this.endGame('modal.gameOverReasonOut');
    } else if (reason === 'blocked_cell') {
      this.endGame('modal.gameOverReasonBlocked');
    }
  }

  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    const state = get(gameState);
    const gameType = get(gameState).players.length > 1 ? 'local' : 'vs-computer';
    const finalScoreDetails = gameLogicService.calculateFinalScore(state as any, gameType);

    const endGameChanges = {
      isGameOver: true,
      gameOverReasonKey: reasonKey,
      gameOverReasonValues: reasonValues,
    };
    await stateManager.applyChanges('END_GAME', endGameChanges, `Game ended: ${reasonKey}`);

    const { winners } = this.determineWinner(state, reasonKey);
    gameOverStore.setGameOver({
      scores: state.players.map(p => ({ playerId: p.id, score: p.score })),
      winners: winners,
      reasonKey,
      reasonValues,
      finalScoreDetails,
      gameType: gameType,
    });

    const { titleKey, content } = this.createGameOverModalContent(reasonKey, reasonValues, finalScoreDetails, state);

    modalStore.showModal({
      titleKey,
      content,
      dataTestId: 'game-over-modal',
      titleDataTestId: 'game-over-modal-title',
      buttons: [
        { textKey: 'modal.playAgain', primary: true, onClick: () => this.restartGame(), isHot: true },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => gameOrchestrator.requestReplay() }
      ]
    });
  }

  async restartGame(): Promise<void> {
    gameLogicService.resetGame({}, get(gameState));
    modalStore.closeModal();
  }
}