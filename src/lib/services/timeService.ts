// file: src/lib/services/timeService.ts
import { writable } from 'svelte/store';
import { logService } from './logService';

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
}

class TimeService {
  private timer: any = null;
  public state = writable<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
  });

  public startTimer() {
    logService.logicTime('Starting timer');
    const now = Date.now();
    this.state.update(state => {
      if (state.isRunning) return state;
      return {
        ...state,
        isRunning: true,
        startTime: now,
      };
    });

    this.timer = setInterval(() => {
      this.state.update(state => {
        if (!state.isRunning || !state.startTime) return state;
        return {
          ...state,
          elapsedTime: Date.now() - state.startTime,
        };
      });
    }, 1000);
  }

  public stopTimer() {
    logService.logicTime('Stopping timer');
    this.state.update(state => {
      if (!state.isRunning) return state;
      clearInterval(this.timer);
      this.timer = null;
      return {
        ...state,
        isRunning: false,
      };
    });
  }

  public resetTimer() {
    logService.logicTime('Resetting timer');
    this.stopTimer();
    this.state.set({
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
    });
  }
}

export const timeService = new TimeService();