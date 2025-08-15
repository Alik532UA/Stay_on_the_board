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
import { stateManager } from '$lib/services/stateManager';
import { userActionService } from '$lib/services/userActionService';
import { sideEffectService, type SideEffect } from '$lib/services/sideEffectService';
import type { FinalScoreDetails } from '$lib/models/score';
import { Figure, type MoveDirectionType } from '$lib/models/Figure';
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { logService } from '$lib/services/logService';
import { calculateFinalScore } from '$lib/services/scoreService';

export class VsComputerGameMode extends BaseGameMode {
  initialize(initialState: GameState): void {
    // У цьому режимі ініціалізація відбувається через стандартний resetGame
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
    const currentState = get(gameState);
    const nextPlayerIndex = (currentState.currentPlayerIndex + 1) % currentState.players.length;

    await stateManager.applyChanges(
      'ADVANCE_TURN',
      { currentPlayerIndex: nextPlayerIndex },
      `Turn advanced to player ${nextPlayerIndex}`
    );

    const nextPlayer = get(gameState).players[nextPlayerIndex];
    if (nextPlayer.type === 'ai') {
      return this.triggerComputerMove();
    }
    return [];
  }

  private async triggerComputerMove(): Promise<SideEffect[]> {
    const state = get(gameState);
    await stateManager.applyChanges('SET_COMPUTER_TURN', { isComputerMoveInProgress: true }, 'Starting computer move');

    const computerMove = gameLogicService.getComputerMove();
    let sideEffects: SideEffect[] = [];

    if (computerMove) {
      const { direction, distance } = computerMove;
      const settings = get(settingsStore);
      const moveResult = await gameLogicService.performMove(direction, distance, state.currentPlayerIndex, state, settings);

      if (!moveResult.success) {
        sideEffects = await this.handleNoMoves('computer');
      } else {
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
          await stateManager.applyChanges(
            'RESET_WAS_RESUMED_AFTER_COMPUTER_MOVE',
            { wasResumed: false },
            'Resetting wasResumed after successful computer move'
          );
        }
        sideEffects = [...sideEffects, ...(await this.advanceToNextPlayer())];
      }
    } else {
      sideEffects = await this.handleNoMoves('computer');
    }
    await stateManager.applyChanges('SET_PLAYER_TURN', { isComputerMoveInProgress: false }, 'Computer move completed');
    sideEffects.forEach(effect => sideEffectService.execute(effect));
    return sideEffects;
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    // У режимі гри з комп'ютером, всі очки (бонуси та штрафи) додаються до загального рахунку,
    // а не до конкретного гравця. `performMove` вже оновив загальний стан,
    // тому тут нічого робити не потрібно.
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<SideEffect[]> {
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
            { textKey: 'modal.continueGame', customClass: 'green-btn', isHot: true, onClick: () => userActionService.handleModalAction('continueAfterNoMoves') },
            {
              text: get(_)('modal.finishGameWithBonus', { values: { bonus: updatedState.boardSize } }),
              onClick: () => userActionService.handleModalAction('finishWithBonus', { reasonKey: 'modal.gameOverReasonBonus' })
            },
            { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => userActionService.handleModalAction('requestReplay') }
          ],
          closable: false,
          dataTestId: playerType === 'human' ? 'player-no-moves-modal' : 'opponent-trapped-modal',
          titleDataTestId: 'opponent-trapped-modal-title'
        }
      }
    ];
  }
}