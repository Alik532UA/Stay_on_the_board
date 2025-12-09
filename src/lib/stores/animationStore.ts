// src/lib/stores/animationStore.ts
import { writable } from 'svelte/store';
import { logService } from '../services/logService';
import type { MoveDirectionType } from '$lib/models/Piece';

if (typeof global !== 'undefined' && !global.requestAnimationFrame) {
  global.requestAnimationFrame = (cb: FrameRequestCallback): number => setTimeout(cb, 0) as unknown as number;
}

/**
 * Рух для візуалізації анімації
 */
export interface AnimationMove {
  player: number;
  direction: MoveDirectionType;
  distance: number;
  row?: number;
  col?: number;
}

export interface AnimationState {
  isAnimating: boolean;
  gameId: number;
  currentAnimation: AnimationMove | null;
  visualMoveQueue: AnimationMove[];
  animationQueue: AnimationMove[];
  isPlayingAnimation: boolean;
  isComputerMoveCompleted: boolean;
}

export const initialState: AnimationState = {
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
