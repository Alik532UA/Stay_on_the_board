import { writable, get, type Writable } from 'svelte/store';
import type { MoveHistoryItem } from '$lib/types/gameMove';

/**
 * Стан для replay компонента
 */
export interface ReplayState {
  replayCurrentStep: number;
  moveHistory: MoveHistoryItem[];
  autoPlayDirection: 'paused' | 'forward' | 'backward';
}

const { subscribe, update } = writable({
  direction: 'paused' as 'paused' | 'forward' | 'backward',
  intervalId: null as ReturnType<typeof setInterval> | null,
});

function stepForward() {
  // Логіка буде реалізована в ReplayViewer
}

function stepBackward() {
  // Логіка буде реалізована в ReplayViewer
}

function togglePlayPause() {
  // Логіка буде реалізована в ReplayViewer
}

export const replayAutoPlayStore = {
  subscribe,
  stepForward,
  stepBackward,
  togglePlayPause,
  cancelAllEffects: () => {
    update(store => {
      if (store.intervalId) {
        clearInterval(store.intervalId);
      }
      return { direction: 'paused', intervalId: null };
    });
  },
  // Залишаємо toggleAutoPlay для сумісності з ReplayViewer
  toggleAutoPlay: (
    direction: 'forward' | 'backward',
    replayState: Writable<ReplayState>,
    goToStep: (step: number) => void
  ) => {
    update(store => {
      if (store.intervalId) {
        clearInterval(store.intervalId);
      }

      const currentState = get(replayState);
      if (store.direction === direction) {
        replayState.update((s: ReplayState) => ({ ...s, autoPlayDirection: 'paused' }));
        return { direction: 'paused', intervalId: null };
      }

      if (direction === 'forward' && currentState.replayCurrentStep >= currentState.moveHistory.length - 1) {
        goToStep(0);
      }

      const newIntervalId = setInterval(() => {
        const s = get(replayState);
        const nextStep = s.replayCurrentStep + (direction === 'forward' ? 1 : -1);

        if (nextStep >= 0 && nextStep < s.moveHistory.length) {
          goToStep(nextStep);
        } else {
          if (newIntervalId) clearInterval(newIntervalId);
          replayState.update((st: ReplayState) => ({ ...st, autoPlayDirection: 'paused' }));
        }
      }, 1000);

      replayState.update((s: ReplayState) => ({ ...s, autoPlayDirection: direction }));
      return { direction, intervalId: newIntervalId };
    });
  }
};
