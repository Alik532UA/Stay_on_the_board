// src/lib/services/timeService.ts
import { writable } from 'svelte/store';

export const turnTime = writable(0);

let turnTimer: NodeJS.Timeout | null = null;

export const timeService = {
  startTurnTimer(onTimeUp: () => void) {
    this.stopTurnTimer();
    turnTime.set(60); // 60 seconds per turn
    turnTimer = setInterval(() => {
      turnTime.update(t => {
        if (t > 0) {
          return t - 1;
        } else {
          this.stopTurnTimer();
          onTimeUp();
          return 0;
        }
      });
    }, 1000);
  },

  stopTurnTimer() {
    if (turnTimer) {
      clearInterval(turnTimer);
      turnTimer = null;
    }
  }
};