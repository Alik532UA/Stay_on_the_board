import { get } from 'svelte/store';
import { _, locale } from 'svelte-i18n';
import type { IGameMode } from './gameMode.interface';
import { speakText } from '$lib/services/speechService';
import { lastComputerMove, availableMoves as derivedAvailableMoves } from '$lib/stores/derivedState';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { stateManager } from '$lib/services/stateManager';
import { agents } from '$lib/playerAgents';
import { modalStore } from '$lib/stores/modalStore';
import { gameOrchestrator } from '$lib/gameOrchestrator';
import type { FinalScoreDetails } from '$lib/gameOrchestrator';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { logService } from '$lib/services/logService';

export class VsComputerGameMode implements IGameMode {
  initialize(initialState: GameState): void {
    // У цьому режимі ініціалізація відбувається через стандартний resetGame
  }

  async handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<void> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

    if (moveResult.success) {
      this.onPlayerMoveSuccess();
    } else {
      this.onPlayerMoveFailure(moveResult.reason, direction, distance);
    }
  }

  private async onPlayerMoveSuccess(): Promise<void> {
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

  private async onPlayerMoveFailure(reason: string | undefined, direction: MoveDirectionType, distance: number): Promise<void> {
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
    const finalScoreDetails = gameLogicService.calculateFinalScore(state as any);

    const endGameChanges = {
      isGameOver: true,
      baseScore: finalScoreDetails.baseScore,
      sizeBonus: finalScoreDetails.sizeBonus,
      blockModeBonus: finalScoreDetails.blockModeBonus,
      jumpBonus: finalScoreDetails.jumpBonus,
      finishBonus: finalScoreDetails.finishBonus,
      noMovesBonus: finalScoreDetails.noMovesBonus,
      totalPenalty: finalScoreDetails.totalPenalty,
      totalScore: finalScoreDetails.totalScore,
      gameOverReasonKey: reasonKey,
      gameOverReasonValues: reasonValues,
      cellVisitCounts: {}
    };

    await stateManager.applyChanges('END_GAME', endGameChanges, `Game ended: ${reasonKey}`);

    gameOverStore.setGameOver({
      scores: state.players.map(p => ({ playerId: p.id, score: p.score })),
      winners: [], // У грі проти комп'ютера переможець не визначається на цьому етапі
      reasonKey,
      reasonValues,
      finalScoreDetails,
      gameType: 'vs-computer',
    });

    const { titleKey, content } = this.createGameOverModalContent(reasonKey, reasonValues, finalScoreDetails, state);

    modalStore.showModal({
      titleKey,
      content,
      buttons: [
        { textKey: 'modal.playAgain', primary: true, onClick: () => this.restartGame(), isHot: true },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => gameOrchestrator.startReplay() }
      ]
    });
  }

  async restartGame(): Promise<void> {
    gameLogicService.resetGame({}, get(gameState));
    modalStore.closeModal();
  }

  async claimNoMoves(): Promise<void> {
    const currentAvailableMoves = get(derivedAvailableMoves);

    if (currentAvailableMoves.length > 0) {
      this.endGame('modal.errorContent', { count: currentAvailableMoves.length });
    } else {
      this.handleNoMoves('human');
    }
  }

  getPlayersConfiguration(): Player[] {
    return [
      { id: 1, type: 'human', name: 'Гравець', score: 0 },
      { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0 }
    ];
  }

  determineWinner(state: GameState) {
    // У грі проти комп'ютера немає концепції переможця, лише рахунок
    return { winners: [] as number[], winningPlayerIndex: -1 };
  }

  createGameOverModalContent(reasonKey: string, reasonValues: Record<string, any> | null, finalScoreDetails: FinalScoreDetails, state: GameState) {
    const modalReason = get(_)(reasonKey, reasonValues ? { values: reasonValues } : undefined);
    return {
      titleKey: 'modal.gameOverTitle',
      content: {
        reason: modalReason,
        scoreDetails: finalScoreDetails
      }
    };
  }

  private async advanceToNextPlayer(): Promise<void> {
    const currentState = get(gameState);
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    await stateManager.applyChanges(
      'ADVANCE_TURN',
      { currentPlayerIndex: nextPlayerIndex },
      `Turn advanced to player ${nextPlayerIndex}`
    );

    const nextPlayer = get(gameState).players[nextPlayerIndex];
    if (nextPlayer.type === 'ai') {
      this.triggerComputerMove();
    }
  }

  private async triggerComputerMove(): Promise<void> {
    const state = get(gameState);
    await stateManager.applyChanges('SET_COMPUTER_TURN', { isComputerMoveInProgress: true }, 'Starting computer move');

    const computerMove = await agents.ai.getMove(state as any);

    if (computerMove) {
      const { direction, distance } = computerMove;
      const settings = get(settingsStore);
      const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

      if (!moveResult.success) {
        this.handleNoMoves('computer');
      } else {
        const settings = get(settingsStore);
        if (settings.speechEnabled) {
          const lastMove = get(lastComputerMove);
          if (lastMove) {
            const directionKey = lastMove.direction.replace(/-(\w)/g, (_, c) => c.toUpperCase());
            const moveDirection = get(_)('gameBoard.directions.' + directionKey);
            const textToSpeak = `${moveDirection} ${lastMove.distance}`;
            const lang = get(locale) || 'uk';
            speakText(textToSpeak, lang, settings.selectedVoiceURI);
          }
        }
        
        const currentState = get(gameState);
        if (currentState.wasResumed) {
          await stateManager.applyChanges(
            'RESET_WAS_RESUMED_AFTER_COMPUTER_MOVE',
            { wasResumed: false },
            'Resetting wasResumed after successful computer move'
          );
        }
        this.advanceToNextPlayer();
      }
    } else {
      this.handleNoMoves('computer');
    }
    await stateManager.applyChanges('SET_PLAYER_TURN', { isComputerMoveInProgress: false }, 'Computer move completed');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    const state = get(gameState);
    gameOverStore.resetGameOverState();

    await stateManager.applyChanges(
      'SUCCESSFUL_NO_MOVES_CLAIM',
      {
        noMovesClaimed: true,
        noMovesBonus: (state.noMovesBonus || 0) + state.boardSize
      },
      `${playerType} has no moves and bonus is awarded`
    );

    const updatedState = get(gameState);
    const potentialScoreDetails = gameLogicService.calculateFinalScore(updatedState as any);
    const titleKey = playerType === 'human' ? 'modal.playerNoMovesTitle' : 'modal.computerNoMovesTitle';
    const contentKey = playerType === 'human' ? 'modal.playerNoMovesContent' : 'modal.computerNoMovesContent';

    modalStore.showModal({
      titleKey,
      content: {
        reason: get(_)(contentKey),
        scoreDetails: potentialScoreDetails
      },
      buttons: [
        { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: () => gameOrchestrator.continueAfterNoMoves() },
        {
          text: get(_)('modal.finishGameWithBonus', { values: { bonus: updatedState.boardSize } }),
          onClick: () => gameOrchestrator.finalizeGameWithBonus('modal.gameOverReasonBonus')
        },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => gameOrchestrator.startReplay() }
      ],
      closable: false
    });
  }
}