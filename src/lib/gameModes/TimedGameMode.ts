import { timeService } from '$lib/services/timeService';
import { endGameService } from '$lib/services/endGameService';
import { get } from 'svelte/store';
import { gameState, type GameState } from '$lib/stores/gameState';
import { TrainingGameMode } from './TrainingGameMode';

export class TimedGameMode extends TrainingGameMode {
  constructor() {
    super();
    this.gameDuration = 100; // 100 секунд на гру
  }

  initialize(initialState: GameState): void {
    super.initialize(initialState);
    timeService.initializeTimers(this.gameDuration, this.turnDuration);
    // Таймер запускається після першого ходу
  }

  async handlePlayerMove(direction: any, distance: any): Promise<void> {
    const state = get(gameState);
    if (state.isFirstMove) {
      this.startGameTimer();
    } else if (state.wasResumed) {
      this.resumeTimers();
    }
    await super.handlePlayerMove(direction, distance);
  }

  protected startGameTimer(): void {
    if (this.gameDuration > 0) {
      timeService.startGameTimer(this.gameDuration, () => {
        endGameService.endGame('modal.gameOverReasonTimeUp');
      });
    }
  }
}