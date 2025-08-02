import { get, type Writable } from 'svelte/store';

export const replayAutoPlayStore = (() => {
  let autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  function toggleAutoPlay(
    direction: 'forward' | 'backward',
    replayState: Writable<any>,
    goToStep: (step: number) => void
  ) {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }

    const currentState = get(replayState);
    const currentDirection = currentState.autoPlayDirection;

    if (currentDirection === direction && currentDirection !== 'paused') {
      replayState.update((s: any) => ({ ...s, autoPlayDirection: 'paused' }));
      return;
    }

    if (direction === 'forward' && currentState.replayCurrentStep >= currentState.moveHistory.length - 1) {
      goToStep(0);
    }

    replayState.update((s: any) => ({ ...s, autoPlayDirection: direction }));

    autoPlayInterval = setInterval(() => {
      const s = get(replayState); // <-- Ключове виправлення: отримуємо актуальний стан
      const nextStep = s.replayCurrentStep + (direction === 'forward' ? 1 : -1);

      if (nextStep >= 0 && nextStep < s.moveHistory.length) {
        goToStep(nextStep);
      } else {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        replayState.update((st: any) => ({ ...st, autoPlayDirection: 'paused' }));
      }
    }, 1000);
  }

  return {
    toggleAutoPlay
  };
})(); 