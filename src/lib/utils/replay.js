import { derived } from 'svelte/store';

/**
 * @param {import('svelte/store').Readable<any>} replayState
 */
export const replayPosition = (replayState) => derived(
  replayState,
  /** @param {any} $replayState */
  ($replayState) => {
    if (!$replayState.isReplayMode) return null;
    
    // Використовуємо Math.min, щоб replayCurrentStep ніколи не виходив
    // за межі масиву moveHistory. Це гарантує, що ми завжди
    // отримуємо валідний запис, навіть на останньому кроці анімації.
    const historyIndex = Math.min($replayState.replayCurrentStep, $replayState.moveHistory.length - 1);
    
    return $replayState.moveHistory[historyIndex]?.pos;
  }
);

/**
 * @param {import('svelte/store').Readable<any>} replayState
 */
export const replayCellVisitCounts = (replayState) => derived(
  replayState,
  /** @param {any} $replayState */
  ($replayState) => {
    if (!$replayState.isReplayMode) return {};
    
    // Визначаємо індекс запису в історії, який потрібно відобразити.
    // Якщо поточний крок виходить за межі, використовуємо останній доступний запис.
    const historyIndex = Math.min($replayState.replayCurrentStep, $replayState.moveHistory.length - 1);
    
    const currentHistoryEntry = $replayState.moveHistory[historyIndex];
    
    if (currentHistoryEntry && currentHistoryEntry.blockModeEnabled === false) {
      return {};
    }
    
    return currentHistoryEntry?.visits || {};
  }
);

/**
 * @param {import('svelte/store').Readable<any>} replayState
 */
export const replaySegments = (replayState) => derived(
  replayState,
  /** @param {any} $replayState */
  ($replayState) => {
    if (!$replayState.isReplayMode || $replayState.moveHistory.length < 2) {
      return [];
    }

    const segments = [];
    const history = $replayState.moveHistory;
    const totalSteps = history.length - 1;
    const cellSize = 100 / $replayState.boardSize;
    const currentStep = $replayState.replayCurrentStep;
    const limitPath = $replayState.limitReplayPath;

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
        const dist = Math.abs(i - currentStep);
        if (i < currentStep) { // Минулі ходи
            opacity = Math.max(0, 1.0 - dist * 0.2);
        } else { // Майбутні ходи
            opacity = Math.max(0, 1.0 - dist * 0.3);
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

/**
 * @param {import('svelte/store').Readable<any>} replayState
 */
export const replayBlockModeEnabled = (replayState) => derived(
  replayState,
  /** @param {any} $replayState */
  ($replayState) => {
    if (!$replayState.isReplayMode) return false;
    
    // Визначаємо індекс запису в історії, який потрібно відобразити.
    // Якщо поточний крок виходить за межі, використовуємо останній доступний запис.
    const historyIndex = Math.min($replayState.replayCurrentStep, $replayState.moveHistory.length - 1);
    
    const currentEntry = $replayState.moveHistory[historyIndex];
    // Повертаємо збережений стан режиму блокування для поточного кроку,
    // або false за замовчуванням.
    return currentEntry?.blockModeEnabled ?? false;
  }
); 
