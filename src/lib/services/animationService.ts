// src/lib/services/animationService.ts
import { get } from 'svelte/store';
import { animationStore } from '$lib/stores/animationStore';
import { logService } from './logService';
import { gameModeStore } from '$lib/stores/gameModeStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { animationConfig, type AnimationConfigMode, type AnimationConfigPreset } from '$lib/config/animationConfig';
import { gameEventBus } from './gameEventBus';

function createAnimationService() {
  let unsubscribe: (() => void) | null = null;

  function addToAnimationQueue(move: any) {
    logService.animation('[AnimationService] addToAnimationQueue:', move);
    animationStore.update(state => {
      const newQueue = [...state.animationQueue, move];
      if (!state.isPlayingAnimation) {
        setTimeout(() => playNextAnimation(true), 0);
      }
      return { ...state, animationQueue: newQueue };
    });
  }

  function playNextAnimation(isFirstCall = false) {
    if (isFirstCall) {
      animationStore.update(s => ({ ...s, isAnimating: true, isPlayingAnimation: true, isComputerMoveCompleted: false, visualMoveQueue: [] }));
    }

    const state = get(animationStore);
    if (state.animationQueue.length === 0) {
      animationStore.update(s => ({ ...s, isAnimating: false, isPlayingAnimation: false }));
      return;
    }

    const move = state.animationQueue[0];
    animationStore.update(s => ({
      ...s,
      visualMoveQueue: [...s.visualMoveQueue, move]
    }));

    const isPlayerMove = move.player === 1;
    const animationDuration = 500;

    const activeMode = get(gameModeStore).activeMode as AnimationConfigMode;
    const currentPreset = get(gameSettingsStore).gameMode as AnimationConfigPreset | null;

    let pauseValues = { player: 100, computer: 100 }; // Default values

    if (activeMode === 'training') {
      if (currentPreset && animationConfig.training[currentPreset]) {
        pauseValues = animationConfig.training[currentPreset];
      }
    } else if (activeMode && animationConfig[activeMode]) {
      const configForMode = animationConfig[activeMode];
      if ('player' in configForMode) {
        pauseValues = configForMode;
      }
    }

    const pauseAfterMove = isPlayerMove ? pauseValues.player : pauseValues.computer;

    setTimeout(() => {
      if (!isPlayerMove) {
        animationStore.update(s => ({ ...s, isComputerMoveCompleted: true }));
      }
      animationStore.update(s => ({
        ...s,
        animationQueue: s.animationQueue.slice(1)
      }));
      playNextAnimation(false);
    }, animationDuration + pauseAfterMove);
  }

  return {
    initialize: () => {
      if (unsubscribe) return; // Prevent multiple subscriptions
      unsubscribe = gameEventBus.subscribe('new_move_added', addToAnimationQueue);
    },
    destroy: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
    reset: () => {
      logService.animation('[AnimationService] reset() called');
      animationStore.reset();
    }
  };
}

export const animationService = createAnimationService();