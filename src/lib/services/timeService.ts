import { writable, get } from 'svelte/store';
import { logService } from './logService';

export const playerScore = writable(0);
export const timeLimit = writable(60); // 60 seconds
export const timeLeft = writable(60);
export const isTimeGameRunning = writable(false);
export const turnTimeLimit = writable(15); // 15 seconds per turn
export const turnTimeLeft = writable(15);

let gameTimer: NodeJS.Timeout;
let turnTimer: NodeJS.Timeout;

/**
 * Starts the main game timer.
 */
function startGame() {
  isTimeGameRunning.set(true);
  timeLeft.set(get(timeLimit));
  playerScore.set(0);

  gameTimer = setInterval(() => {
    timeLeft.update(t => {
      if (t > 0) {
        return t - 1;
      } else {
        clearInterval(gameTimer);
        isTimeGameRunning.set(false);
        logService.logicTime('Time is up!');
        return 0;
      }
    });
  }, 1000);
}

/**
 * Stops the main game timer.
 */
function stopGame() {
  clearInterval(gameTimer);
  isTimeGameRunning.set(false);
}

/**
 * Starts the timer for a player's turn.
 * @param onTimeUp Callback function to execute when the turn time is up.
 */
function startTurnTimer(onTimeUp: () => void) {
  turnTimeLeft.set(get(turnTimeLimit));
  turnTimer = setInterval(() => {
    turnTimeLeft.update(t => {
      if (t > 0) {
        return t - 1;
      } else {
        clearInterval(turnTimer);
        onTimeUp();
        return 0;
      }
    });
  }, 1000);
}

/**
 * Stops the turn timer.
 */
function stopTurnTimer() {
  clearInterval(turnTimer);
}

/**
 * Adds points to the player's score in a timed game.
 * @param points The number of points to add.
 */
function addScore(points: number) {
  playerScore.update(s => s + points);
}

export const timeService = {
  playerScore,
  timeLimit,
  timeLeft,
  isTimeGameRunning,
  startGame,
  stopGame,
  addScore,
  turnTimeLimit,
  turnTimeLeft,
  startTurnTimer,
  stopTurnTimer
};