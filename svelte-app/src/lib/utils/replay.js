import { derived } from 'svelte/store';
import { appState } from '$lib/stores/gameStore.js';

/**
 * Реактивна змінна, що розраховує позицію ферзя для поточного кроку реплею або гри.
 */
export const replayPosition = derived(
  appState,
  ($appState) => {
    if ($appState.isReplayMode) {
      return $appState.moveHistory[$appState.replayCurrentStep]?.pos;
    }
    if ($appState.playerRow !== null && $appState.playerCol !== null) {
      return { row: $appState.playerRow, col: $appState.playerCol };
    }
    return null;
  }
);

/**
 * Реактивна змінна, що повертає об'єкт з кількістю відвідувань клітинок для поточного кроку реплею.
 */
export const replayCellVisitCounts = derived(
  appState,
  ($appState) => $appState.isReplayMode
    ? $appState.moveHistory[$appState.replayCurrentStep]?.visits || {}
    : {}
);

/**
 * Реактивна змінна, що розраховує сегменти лінії для візуалізації шляху реплею.
 */
export const replaySegments = derived(
  appState,
  ($appState) => {
    if (!$appState.isReplayMode || $appState.moveHistory.length < 2) {
      return [];
    }

    const segments = [];
    const history = $appState.moveHistory;
    const totalSteps = history.length - 1;
    const cellSize = 100 / $appState.boardSize;
    const currentStep = $appState.replayCurrentStep;
    const limitPath = $appState.limitReplayPath;

    const startColor = { r: 76, g: 175, b: 80 };
    const endColor = { r: 244, g: 67, b: 54 };

    for (let i = 0; i < totalSteps; i++) {
      const startPos = history[i].pos;
      const endPos = history[i + 1].pos;
      
      const ratio = i / totalSteps;
      const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
      const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
      const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));

      let opacity = 1.0;
      if (limitPath) {
        const dist = i - currentStep;
        if (dist >= 0 && dist < 3) {
          opacity = 1.0 - dist * 0.3;
        } else if (dist < 0 && dist >= -1) {
          opacity = 0.7;
        } else {
          opacity = 0;
        }
      }

      segments.push({
        x1: startPos.col * cellSize + cellSize / 2,
        y1: startPos.row * cellSize + cellSize / 2,
        x2: endPos.col * cellSize + cellSize / 2,
        y2: endPos.row * cellSize + cellSize / 2,
        color: `rgb(${r}, ${g}, ${b})`,
        opacity: Math.max(0, opacity)
      });
    }
    return segments;
  }
); 