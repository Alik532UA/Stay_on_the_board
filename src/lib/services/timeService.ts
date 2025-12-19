// file: src/lib/services/timeService.ts
import { timerStore } from '$lib/stores/timerStore';
import { logService } from './logService';

class TimeService {
  private gameTimerInterval: NodeJS.Timeout | null = null;
  private turnTimerInterval: NodeJS.Timeout | null = null;
  private gameTimerConfig: { duration: number, onTimeout: () => void } | null = null;
  private turnTimerConfig: { onTimeout: () => void } | null = null;
  private isGameTimerPaused: boolean = false;
  private isTurnTimerPaused: boolean = false;

  public startGameTimer(duration: number, onTimeout: () => void) {
    this.stopGameTimer();
    this.gameTimerConfig = { duration, onTimeout };
    this.isGameTimerPaused = false;
    logService.GAME_MODE(`[TimeService] Starting game timer for ${duration} seconds.`);

    timerStore.setRemainingTime(duration);

    this.gameTimerInterval = setInterval(() => {
      timerStore.update(state => {
        if (state.remainingTime === null || this.isGameTimerPaused) return state;

        const newTime = state.remainingTime - 1;
        if (newTime <= 0) {
          this.stopGameTimer();
          onTimeout();
        }
        return {
          ...state,
          remainingTime: newTime
        };
      });
    }, 1000);
  }

  public stopGameTimer() {
    if (this.gameTimerInterval) {
      logService.GAME_MODE('[TimeService] Stopping game timer.');
      clearInterval(this.gameTimerInterval);
      this.gameTimerInterval = null;
      this.gameTimerConfig = null;
    }
  }

  public pauseGameTimer() {
    if (this.gameTimerInterval) {
      logService.GAME_MODE('[TimeService] Pausing game timer.');
      this.isGameTimerPaused = true;
    }
  }

  public resumeGameTimer() {
    if (this.gameTimerConfig && this.isGameTimerPaused) {
      logService.GAME_MODE('[TimeService] Resuming game timer.');
      this.isGameTimerPaused = false;
    }
  }

  public startTurnTimer(duration: number, onTimeout: () => void) {
    this.stopTurnTimer();
    this.turnTimerConfig = { onTimeout };
    this.isTurnTimerPaused = false;
    logService.GAME_MODE(`[TimeService] Starting turn timer for ${duration} seconds.`);

    timerStore.setTurnTimeLeft(duration);

    this.turnTimerInterval = setInterval(() => {
      timerStore.update(state => {
        if (state.turnTimeLeft === null || this.isTurnTimerPaused) return state;

        const newTime = state.turnTimeLeft - 1;
        if (newTime <= 0) {
          this.stopTurnTimer();
          onTimeout();
        }
        return {
          ...state,
          turnTimeLeft: newTime
        };
      });
    }, 1000);
  }

  public stopTurnTimer() {
    if (this.turnTimerInterval) {
      logService.GAME_MODE('[TimeService] Stopping turn timer.');
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
      this.turnTimerConfig = null;
    }
  }

  public pauseTurnTimer() {
    if (this.turnTimerInterval) {
      logService.GAME_MODE('[TimeService] Pausing turn timer.');
      this.isTurnTimerPaused = true;
    }
  }

  public resumeTurnTimer() {
    if (this.turnTimerConfig && this.isTurnTimerPaused) {
      logService.GAME_MODE('[TimeService] Resuming turn timer.');
      this.isTurnTimerPaused = false;
    }
  }

  public cleanup() {
    this.stopGameTimer();
    this.stopTurnTimer();
  }
}

export const timeService = new TimeService();
