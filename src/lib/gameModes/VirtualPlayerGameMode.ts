import { get } from 'svelte/store';
import { TrainingGameMode } from './TrainingGameMode';
import type { Player } from '$lib/models/player';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { logService } from '$lib/services/logService';
import { animationService } from '$lib/services/animationService';
import { noMovesService } from '$lib/services/noMovesService';
import { timeService } from '$lib/services/timeService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { gameService } from '$lib/services/gameService';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { boardStore } from '$lib/stores/boardStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { timerStore } from '$lib/stores/timerStore';
import { endGameService } from '$lib/services/endGameService';

import { voiceControlService } from '$lib/services/voiceControlService';

export class VirtualPlayerGameMode extends TrainingGameMode {

  constructor() {
    super();
  }

  initialize(options: { newSize?: number } = {}): void {
    timeService.stopGameTimer();
    super.initialize(options);
    gameSettingsStore.updateSettings({
      speechRate: 1.6,
      shortSpeech: true,
      speechFor: { player: false, computer: true },
    });
  }

  getPlayersConfiguration(): Player[] {
    return [
      { id: 1, type: 'human', name: 'Гравець', score: 0, color: '#000000', isComputer: false, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: 2, type: 'ai', name: 'Комп\'ютер', score: 0, color: '#ffffff', isComputer: true, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
    ];
  }

  getModeName(): 'virtual-player' {
    return 'virtual-player';
  }



  protected async advanceToNextPlayer(): Promise<void> {
    logService.GAME_MODE('advanceToNextPlayer: Передача ходу наступному гравцю.');
    const currentPlayerState = get(playerStore);
    if (!currentPlayerState) return;
    const nextPlayerIndex = (currentPlayerState.currentPlayerIndex + 1) % currentPlayerState.players.length;

    playerStore.update(s => s ? { ...s, currentPlayerIndex: nextPlayerIndex } : null);

    const nextPlayer = get(playerStore)?.players[nextPlayerIndex];
    logService.GAME_MODE(`advanceToNextPlayer: Наступний гравець: ${nextPlayer?.type}.`);
    if (nextPlayer?.type === 'ai') {
      logService.GAME_MODE('advanceToNextPlayer: Запуск ходу комп\'ютера.');
      await this.triggerComputerMove();
    } else {
      this.startTurn();
      // ВИДАЛЕНО: Ця логіка дублювала логіку в onEndCallback у BaseGameMode
      // і викликалася передчасно, що призводило до конфліктів.
      // if (get(uiStateStore).voiceMoveRequested) {
      //   logService.GAME_MODE('advanceToNextPlayer: Повторне ввімкнення голосового керування.');
      //   voiceControlService.startListening();
      // }
    }
  }

  protected async applyScoreChanges(scoreChanges: any): Promise<void> {
    // No specific score changes to apply in training mode
  }

  async continueAfterNoMoves(): Promise<void> {
    logService.GAME_MODE(`[${this.constructor.name}] continueAfterNoMoves called`);
    logService.logicMove('State of uiStateStore BEFORE continueAfterNoMoves:', get(uiStateStore));

    // Використовуємо спільну логіку з базового класу
    this.resetBoardForContinuation();

    // Специфічна логіка для virtual-player: повертаємо хід гравцю-людині
    const humanPlayerIndex = get(playerStore)?.players.findIndex(p => p.type === 'human');
    if (humanPlayerIndex !== undefined) {
      playerStore.update(s => s ? { ...s, currentPlayerIndex: humanPlayerIndex } : null);
      logService.logicMove('Set current player to human after continuing game.', { humanPlayerIndex });
    }

    // Скидаємо вибір гравця, щоб він міг зробити новий
    uiStateStore.update(s => s ? ({ ...s, selectedDirection: null, selectedDistance: null }) : null);
    logService.logicMove('State of uiStateStore AFTER continueAfterNoMoves:', get(uiStateStore));

    this.startTurn();
    gameEventBus.dispatch('CloseModal');
  }

  async handleNoMoves(playerType: 'human' | 'computer'): Promise<void> {
    logService.GAME_MODE(`handleNoMoves: Обробка ситуації "немає ходів" для гравця типу: ${playerType}.`);
    const boardState = get(boardStore);
    if (!boardState) return;

    gameOverStore.resetGameOverState();
    scoreStore.update(s => s ? { ...s, noMovesBonus: (s.noMovesBonus || 0) + boardState.boardSize } : null);
    noMovesService.dispatchNoMovesEvent(playerType);
  }

  protected startTurn(): void {
    timeService.stopTurnTimer();
  }
}