import { writable, get } from 'svelte/store';

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
  // Залишаємо toggleAutoPlay для сумісності з ReplayViewer
  toggleAutoPlay: (
    direction: 'forward' | 'backward',
    replayState: import('svelte/store').Writable<{
      replayCurrentStep: number;
      moveHistory: any[];
      autoPlayDirection: 'paused' | 'forward' | 'backward';
    }>,
    goToStep: (step: number) => void
  ) => {
    update(store => {
      if (store.intervalId) {
        clearInterval(store.intervalId);
      }

      const currentState = get(replayState);
      if (store.direction === direction) {
        replayState.update((s: any) => ({ ...s, autoPlayDirection: 'paused' }));
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
          replayState.update((st: any) => ({ ...st, autoPlayDirection: 'paused' }));
        }
      }, 1000);

      replayState.update((s: any) => ({ ...s, autoPlayDirection: direction }));
      return { direction, intervalId: newIntervalId };
    });
  }
};