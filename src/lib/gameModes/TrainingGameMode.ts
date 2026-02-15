import { get } from 'svelte/store';
import { BaseGameMode } from './BaseGameMode';
import type { Player } from '$lib/models/player';
import { createTrainingPlayers } from '$lib/utils/playerFactory';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameEventBus } from '$lib/services/gameEventBus';
import { logService } from '$lib/services/logService';
import { animationService } from '$lib/services/animationService';
import { noMovesService } from '$lib/services/noMovesService';
import { timeService } from '$lib/services/timeService';
import { gameService } from '$lib/services/gameService';
import { scoreStore } from '$lib/stores/scoreStore';
import { boardStore } from '$lib/stores/boardStore';
import type { ScoreChangesData } from '$lib/types/gameMove';

export class TrainingGameMode extends BaseGameMode {
  initialize(options: { newSize?: number } = {}): void {
    gameService.initializeNewGame({
      size: options.newSize,
      players: this.getPlayersConfiguration(),
    });
    this.initEngine();
    animationService.initialize();
    this.startTurn();
  }

  getPlayersConfiguration(): Player[] {
    return createTrainingPlayers();
  }

  getModeName(): 'training' | 'local' | 'timed' | 'online' | 'virtual-player' {
    return 'training';
  }

  protected async applyScoreChanges(scoreChanges: ScoreChangesData): Promise<void> {
    // No specific score changes to apply in training mode
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