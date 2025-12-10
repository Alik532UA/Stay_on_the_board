// src/lib/services/animationService.ts
import { get } from 'svelte/store';
import { animationStore } from '$lib/stores/animationStore';
import { logService } from './logService';
import { gameModeStore } from '$lib/stores/gameModeStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { animationConfig, type AnimationConfigMode, type AnimationConfigPreset } from '$lib/config/animationConfig';
import { gameEventBus } from './gameEventBus';

function createAnimationService() {
  let unsubscribe: (() => void) | null = null;

  function addToAnimationQueue(move: import('$lib/stores/animationStore').AnimationMove) {
    logService.animation('[AnimationService] addToAnimationQueue:', move);
    animationStore.update(state => {
      const newQueue = [...state.animationQueue, move];

      // FIX: Завжди запускаємо анімацію, якщо вона не йде, навіть якщо це перший хід
      if (!state.isPlayingAnimation) {
        // Використовуємо setTimeout, щоб дати Svelte оновити стор перед запуском
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

    const activeMode = get(gameModeStore).activeMode;
    const currentPreset = get(gameSettingsStore).gameMode;
    const isListening = get(uiStateStore).isListening;

    let pauseValues = { player: 100, computer: 100 };

    if (isListening) {
      pauseValues = { player: 30, computer: 30 };
    } else if (activeMode === 'training' || activeMode === 'virtual-player') {
      const cleanPreset = currentPreset?.replace('virtual-player-', '') as AnimationConfigPreset;

      if (cleanPreset && animationConfig.training[cleanPreset]) {
        pauseValues = animationConfig.training[cleanPreset];
      }
    } else if (activeMode && activeMode in animationConfig) {
      const configForMode = animationConfig[activeMode as AnimationConfigMode];
      if ('player' in configForMode) {
        pauseValues = configForMode as { player: number, computer: number };
      }
    }

    let pauseAfterMove = isPlayerMove ? pauseValues.player : pauseValues.computer;

    if (state.animationQueue.length >= 2) {
      logService.animation(`[AnimationService] Catch-up mode active (queue: ${state.animationQueue.length}). Reducing pause to 1ms.`);
      pauseAfterMove = 1;
    } else {
      logService.animation(`[AnimationService] Playing move. Standard pause: ${pauseAfterMove}ms`);
    }

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
      if (unsubscribe) return;
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