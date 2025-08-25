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

  private async triggerComputerMove(): Promise<void> {
    logService.GAME_MODE('triggerComputerMove: Початок ходу комп\'ютера.');
    const state = get(gameState);
    gameStateMutator.applyMove({ isComputerMoveInProgress: true });

    const computerMove = aiService.getComputerMove();
    logService.GAME_MODE('triggerComputerMove: Результат getComputerMove:', computerMove);

    if (computerMove) {
      logService.GAME_MODE('triggerComputerMove: Комп\'ютер має хід, виконуємо...');
      const { direction, distance } = computerMove;
      const settings = get(settingsStore);
      const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

      if (!moveResult.success) {
        await this.onPlayerMoveFailure(moveResult.reason, direction, distance);
      } else {
        gameStateMutator.applyMove(moveResult.changes);

        await new Promise(resolve => setTimeout(resolve, 0));

        await this.onPlayerMoveSuccess(moveResult);
        const settings = get(settingsStore);
        if (settings.speechEnabled) {
          const lastMove = get(lastComputerMove);
          if (lastMove) {
            const allVoices = window.speechSynthesis.getVoices();
            const selectedVoice = allVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
            const speechLang = selectedVoice ? selectedVoice.lang.split('-') : (get(locale) || 'uk');
            gameEventBus.dispatch('SpeakMove', { move: lastMove, lang: speechLang, voiceURI: settings.selectedVoiceURI });
          }
        }
        
        const currentState = get(gameState);
        if (currentState.isResumedGame) {
          gameStateMutator.applyMove({ isResumedGame: false });
        }
      }
    } else {
      logService.GAME_MODE('triggerComputerMove: У комп\'ютера немає ходів, викликаємо handleNoMoves.');
      await this.handleNoMoves('computer');
    }
    await tick();
    gameStateMutator.applyMove({ isComputerMoveInProgress: false });
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    // No specific score changes to apply in training mode
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);
    
    // Централізовано скидаємо стан і перераховуємо доступні ходи
    gameStateMutator.resetForNoMovesContinue(false);

    const updated = get(gameState);
    logService.logicAvailability('[TrainingGameMode] availableMoves after continue:', updated?.availableMoves || []);
    
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