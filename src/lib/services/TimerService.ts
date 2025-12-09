// src/lib/services/TimerService.ts

class TimerService {
  private gameTimer: any = null;
  private turnTimer: any = null;

  public startGameTimer(duration: number, onTimeUp: () => void) {
    this.stopGameTimer();
    this.gameTimer = setTimeout(() => {
      onTimeUp();
    }, duration * 1000);
  }

  public stopGameTimer() {
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }

  public startTurnTimer(duration: number, onTimeUp: () => void) {
    this.stopTurnTimer();
    this.turnTimer = setTimeout(() => {
      onTimeUp();
    }, duration * 1000);
  }

  public stopTurnTimer() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }
}

export const timerService = new TimerService();
