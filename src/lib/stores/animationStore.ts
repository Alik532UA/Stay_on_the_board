// src/lib/stores/animationStore.ts
import { writable, get, type Writable } from 'svelte/store';
import { gameState } from './gameState';
import { logService } from '../services/logService';

// ВАЖЛИВО! Цей store працює ЛИШЕ з візуальним станом для анімації.
// Заборонено напряму змінювати moveQueue або board логічного стану гри з animationStore!
// Всі зміни логіки гри мають відбуватися лише через централізовані сервіси/оркестратор.
//
// This store is for animation state ONLY. Never mutate game logic state (moveQueue, board) from here!
// All game logic updates must go through orchestrator/services only.
// Мокаємо requestAnimationFrame для тестового середовища
if (typeof global !== 'undefined' && !global.requestAnimationFrame) {
  global.requestAnimationFrame = (cb: FrameRequestCallback): number => setTimeout(cb, 0) as unknown as number;
}

/**
 * Інтерфейс для стану анімації
 */

/**
 * Інтерфейс для стану анімації
 */
export interface AnimationState {
  isAnimating: boolean;
  gameId: number;
  currentAnimation: any | null;
  visualMoveQueue: any[];
  animationQueue: any[];
  isPlayingAnimation: boolean;
  isComputerMoveCompleted: boolean;
}

const initialState: AnimationState = {
  isAnimating: false,
  gameId: Date.now(),
  currentAnimation: null,
  visualMoveQueue: [],
  animationQueue: [],
  isPlayingAnimation: false,
  isComputerMoveCompleted: true,
};

const { subscribe, set, update } = writable<AnimationState>(initialState);

export const animationStore = {
  subscribe,
  update,
  set,
  reset: () => {
    logService.animation('AnimationStore: reset()');
    set(initialState);
  }
};