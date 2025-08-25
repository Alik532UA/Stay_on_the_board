// file: src/lib/services/timeService.ts
import { gameState } from '$lib/stores/gameState';
import { gameStateMutator } from './gameStateMutator';
import { logService } from './logService';

class TimeService {
  private gameTimerInterval: NodeJS.Timeout | null = null;
  private turnTimerInterval: NodeJS.Timeout | null = null;
  private gameTimerConfig: { duration: number, onTimeout: () => void } | null = null;
  private isGameTimerPaused: boolean = false;

  public startGameTimer(duration: number, onTimeout: () => void) {
    this.stopGameTimer();
    this.gameTimerConfig = { duration, onTimeout };
    this.isGameTimerPaused = false;
    logService.GAME_MODE(`[TimeService] Starting game timer for ${duration} seconds.`);
    
    gameStateMutator.applyMove({ modeState: { remainingTime: duration } });

    this.gameTimerInterval = setInterval(() => {
      gameState.update(state => {
        if (!state || state.modeState.remainingTime === undefined || this.isGameTimerPaused) return state;

        const newTime = state.modeState.remainingTime - 1;
        if (newTime <= 0) {
          this.stopGameTimer();
          onTimeout();
        }
        return {
          ...state,
          modeState: { ...state.modeState, remainingTime: newTime }
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
    logService.GAME_MODE(`[TimeService] Starting turn timer for ${duration} seconds.`);
    
    gameStateMutator.applyMove({ modeState: { turnTimeLimit: duration } });

    this.turnTimerInterval = setInterval(() => {
      gameState.update(state => {
        if (!state || state.modeState.turnTimeLimit === undefined) return state;

        const newTime = state.modeState.turnTimeLimit - 1;
        if (newTime <= 0) {
          this.stopTurnTimer();
          onTimeout();
        }
        return {
          ...state,
          modeState: { ...state.modeState, turnTimeLimit: newTime }
        };
      });
    }, 1000);
  }

  public stopTurnTimer() {
    if (this.turnTimerInterval) {
      logService.GAME_MODE('[TimeService] Stopping turn timer.');
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }

  public cleanup() {
    this.stopGameTimer();
    this.stopTurnTimer();
  }
}

export const timeService = new TimeService();