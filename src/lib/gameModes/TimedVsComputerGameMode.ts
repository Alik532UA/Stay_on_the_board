// src/lib/gameModes/TimedVsComputerGameMode.ts
import { TrainingGameMode } from './TrainingGameMode';
import { timeService } from '$lib/services/timeService';
import { endGameService } from '$lib/services/endGameService';

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
    }, 60000); // 1 minute game
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
