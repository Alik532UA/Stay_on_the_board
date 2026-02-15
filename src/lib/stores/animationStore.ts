// src/lib/stores/animationStore.ts
// Bridge pattern: writable-обгортка для Svelte 4 компонентів.
// SSoT — animationState.svelte.ts (Runes).
//
// ВАЖЛИВО: Анімації — це ВИКЛЮЧНО візуальний шар.
// Вони НЕ впливають на ігрову логіку та center-info.

import { writable } from 'svelte/store';
import { logService } from '../services/logService';
import type { MoveDirectionType } from '$lib/models/Piece';
import { animationState } from './animationState.svelte';

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
  to?: { row: number; col: number };
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

export const initialState: AnimationState = animationState.getInitialState();

function createAnimationStore() {
  const { subscribe, set: svelteSet } = writable<AnimationState>(animationState.state);

  const syncStore = () => {
    svelteSet(animationState.state);
  };

  return {
    subscribe,
    update: (fn: (s: AnimationState) => AnimationState) => {
      animationState.update(fn);
      syncStore();
    },
    set: (value: AnimationState) => {
      animationState.state = value;
      syncStore();
    },
    reset: () => {
      animationState.reset();
      syncStore();
    }
  };
}

export const animationStore = createAnimationStore();
