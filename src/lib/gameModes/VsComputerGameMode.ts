import { tick } from 'svelte';
import { get } from 'svelte/store';
import { _, locale } from 'svelte-i18n';
import { BaseGameMode } from './index';
import { moveDirections } from '$lib/utils/translations';
import { lastComputerMove, availableMoves as derivedAvailableMoves } from '$lib/stores/derivedState';
import { gameState, type GameState, type Player } from '$lib/stores/gameState';
import * as gameLogicService from '$lib/services/gameLogicService';
import { playerInputStore } from '$lib/stores/playerInputStore';
import { settingsStore } from '$lib/stores/settingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { userActionService } from '$lib/services/userActionService';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { logService } from '$lib/services/logService';
import { calculateFinalScore } from '$lib/services/scoreService';
import { animationStore } from '$lib/stores/animationStore';

export class VsComputerGameMode extends BaseGameMode {
  initialize(initialState: GameState): void {
    const settings = get(settingsStore);
    gameLogicService.resetGame({ players: this.getPlayersConfiguration(), settings }, get(gameState));
  }

  async claimNoMoves(): Promise<SideEffect[]> {
    const currentAvailableMoves = get(derivedAvailableMoves);

    if (currentAvailableMoves.length > 0) {
      return this.endGame('modal.errorContent', { count: currentAvailableMoves.length });
    } else {
      return this.handleNoMoves('human');
    }
  }

  getPlayersConfiguration(): Player[] {
    return [
      { id: 1, type: 'human', name: 'Гравець', score: 0, color: '#e63946', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0, color: '#457b9d', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
    ];
  }

  public determineWinner(state: GameState, reasonKey: string) {
    // У грі проти комп'ютера немає концепції переможця, лише рахунок
    return { winners: [] as number[], winningPlayerIndex: -1 };
  }


  protected async advanceToNextPlayer(): Promise<SideEffect[]> {
    logService.GAME_MODE('advanceToNextPlayer: Передача ходу наступному гравцю.');
    const currentState = get(gameState);
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    gameState.update(state => ({...state, currentPlayerIndex: nextPlayerIndex}));

    const nextPlayer = get(gameState).players[nextPlayerIndex];
    logService.GAME_MODE(`advanceToNextPlayer: Наступний гравець: ${nextPlayer.type}.`);
    if (nextPlayer.type === 'ai' && !get(gameState).isComputerMoveInProgress) {
      logService.GAME_MODE('advanceToNextPlayer: Запуск ходу комп\'ютера.');
      return this.triggerComputerMove();
    }
    return [];
  }

  private async triggerComputerMove(): Promise<SideEffect[]> {
    logService.GAME_MODE('triggerComputerMove: Початок ходу комп\'ютера.');
    const state = get(gameState);
    gameState.update(state => ({...state, isComputerMoveInProgress: true}));


    const computerMove = gameLogicService.getComputerMove();
    logService.GAME_MODE('triggerComputerMove: Результат getComputerMove:', computerMove);
    let sideEffects: SideEffect[] = [];

    if (computerMove) {
      logService.GAME_MODE('triggerComputerMove: Комп\'ютер має хід, виконуємо...');
      const { direction, distance } = computerMove;
      const settings = get(settingsStore);
      const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

      if (!moveResult.success) {
        logService.GAME_MODE('triggerComputerMove: Хід комп\'ютера не вдався, обробка "немає ходів".');
        sideEffects = await this.handleNoMoves('computer');
      } else {
        sideEffects = await this.onPlayerMoveSuccess(moveResult);
        const settings = get(settingsStore);
        if (settings.speechEnabled) {
          const lastMove = get(lastComputerMove);
          if (lastMove) {
            const allVoices = window.speechSynthesis.getVoices();
            const selectedVoice = allVoices.find(v => v.voiceURI === settings.selectedVoiceURI);
            const speechLang = selectedVoice ? selectedVoice.lang.split('-')[0] : (get(locale) || 'uk');

            const directionKey = lastMove.direction.replace(/-(\w)/g, (_: string, c: string) => c.toUpperCase());
            // @ts-ignore
            const moveDirection = moveDirections[speechLang][directionKey];
            const textToSpeak = `${moveDirection} ${lastMove.distance}`;
            sideEffects.push({ type: 'audio/speak', payload: { text: textToSpeak, lang: speechLang, voiceURI: settings.selectedVoiceURI } });
          }
        }
        
        const currentState = get(gameState);
        if (currentState.wasResumed) {
          gameState.update(state => ({...state, wasResumed: false}));
        }
        // sideEffects = [...sideEffects, ...(await this.advanceToNextPlayer())];
      }
    } else {
      logService.GAME_MODE('triggerComputerMove: У комп\'ютера немає ходів, викликаємо handleNoMoves.');
      sideEffects = await this.handleNoMoves('computer');
    }
    gameState.update(state => ({...state, isComputerMoveInProgress: false}));
    playerInputStore.update(state => ({ ...state, isMoveInProgress: false }));
    sideEffects.forEach(effect => sideEffectService.execute(effect));
    return sideEffects;
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    // У режимі гри з комп'ютером, всі очки (бонуси та штрафи) додаються до загального рахунку,
    // а не до конкретного гравця. `performMove` вже оновив загальний стан,
    // тому тут нічого робити не потрібно.
  }

  async continueAfterNoMoves(): Promise<SideEffect[]> {
    logService.GAME_MODE('[VsComputerGameMode] continueAfterNoMoves called');
    const state = get(gameState);
    const settings = get(settingsStore);
    const bonus = state.boardSize;

    const continueChanges = {
      noMovesBonus: state.noMovesBonus + bonus,
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
      gameOverReasonValues: null as Record<string, any> | null,
      // Згідно з правилами, хід залишається у гравця-людини (індекс 0).
      // Тому currentPlayerIndex тут явно встановлюється в 0.
      currentPlayerIndex: 0
    };

    gameState.update(state => ({...state, ...continueChanges}));
    
    gameOverStore.resetGameOverState();
    animationStore.reset();

    // У цьому режимі хід не передається комп'ютеру після очищення дошки.
    // Гравець-людина продовжує свій хід з чистої дошки.
    // Тому this.advanceToNextPlayer() тут не викликається.
    return [{ type: 'ui/closeModal' }];
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<SideEffect[]> {
    logService.GAME_MODE(`handleNoMoves: Обробка ситуації "немає ходів" для гравця типу: ${playerType}.`);
    const state = get(gameState);
    gameOverStore.resetGameOverState();

    gameState.update(state => ({
        ...state,
        noMovesClaimed: true,
        noMovesBonus: (state.noMovesBonus || 0) + state.boardSize
    }));

    const updatedState = get(gameState);
    const potentialScoreDetails = calculateFinalScore(updatedState as any, 'vs-computer');
    const titleKey = playerType === 'human' ? 'modal.playerNoMovesTitle' : 'modal.computerNoMovesTitle';
    const contentKey = playerType === 'human' ? 'modal.playerNoMovesContent' : 'modal.computerNoMovesContent';

    return [
      {
        type: 'ui/showModal',
        payload: {
          titleKey,
          content: {
            reason: get(_)(contentKey),
            scoreDetails: potentialScoreDetails
          },
          buttons: [
            { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: () => userActionService.handleModalAction('continueAfterNoMoves'), dataTestId: 'continue-game-no-moves-btn' },
            {
              text: get(_)('modal.finishGameWithBonus', { values: { bonus: updatedState.boardSize } }),
              onClick: () => userActionService.handleModalAction('finishWithBonus', { reasonKey: 'modal.gameOverReasonBonus' }),
              dataTestId: 'finish-game-with-bonus-btn'
            },
            { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => userActionService.handleModalAction('requestReplay'), dataTestId: `watch-replay-${playerType}-no-moves-btn` }
          ],
          closable: false,
          dataTestId: playerType === 'human' ? 'player-no-moves-modal' : 'opponent-trapped-modal',
          titleDataTestId: 'opponent-trapped-modal-title'
        }
      }
    ];
  }
}