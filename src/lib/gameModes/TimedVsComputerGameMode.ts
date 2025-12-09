// src/lib/gameModes/TimedVsComputerGameMode.ts
import { TrainingGameMode } from './TrainingGameMode';
import { timeService } from '$lib/services/timeService';
import { endGameService } from '$lib/services/endGameService';
import { TIMED_GAME_DURATION } from '$lib/config/timeConstants';

export class TimedVsComputerGameMode extends TrainingGameMode {
  private gameTimer: NodeJS.Timeout | null = null;

  initialize(initialState: any): void {
    super.initialize(initialState);
    this.startGameTimer();
  }

  private startGameTimer() {
    this.stopGameTimer();
    this.gameTimer = setTimeout(() => {
      endGameService.endGame('modal.gameOverReasonTimeUp');
    }, TIMED_GAME_DURATION);
  }

  private stopGameTimer() {
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }

  cleanup(): void {
    super.cleanup();
    this.stopGameTimer();
  }
}
