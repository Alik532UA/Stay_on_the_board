// src/lib/services/timeService.ts
import { writable, get } from 'svelte/store';

export const turnTime = writable(0);
export const gameTime = writable(0);

let turnTimer: NodeJS.Timeout | null = null;
let gameTimer: NodeJS.Timeout | null = null;
let isGameTimerPaused = false;

export const timeService = {
  startTurnTimer(duration: number, onTimeUp: () => void) {
    this.stopTurnTimer();
    turnTime.set(duration);
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
  },

  startGameTimer(duration: number, onTimeUp: () => void) {
    this.stopGameTimer();
    gameTime.set(duration);
    isGameTimerPaused = false;
    gameTimer = setInterval(() => {
      if (!isGameTimerPaused) {
        gameTime.update(t => {
          if (t > 0) {
            return t - 1;
          } else {
            this.stopGameTimer();
            onTimeUp();
            return 0;
          }
        });
      }
    }, 1000);
  },

  stopGameTimer() {
    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }
  },

  pauseGameTimer() {
    isGameTimerPaused = true;
  },

  resumeGameTimer() {
    isGameTimerPaused = false;
  }
};