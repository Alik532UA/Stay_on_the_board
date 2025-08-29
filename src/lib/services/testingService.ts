// src/lib/services/testingService.ts

// НАВІЩО: Цей сервіс надає інструменти для скидання стану додатку під час E2E-тестування.
// Він гарантує, що кожен тест починається з чистого та передбачуваного стану,
// вирішуючи проблему "гонки станів" при паралельному виконанні тестів.

import { animationStore, initialState as initialAnimationState } from '$lib/stores/animationStore';
import { appSettingsStore } from '$lib/stores/appSettingsStore';
import { availableMovesStore } from '$lib/stores/availableMovesStore';
import { boardStore } from '$lib/stores/boardStore';
import { gameModeStore, initialState as initialGameModeState } from '$lib/stores/gameModeStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameStore } from '$lib/stores/gameStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { testModeStore, initialState as initialTestModeState } from '$lib/stores/testModeStore';
import { timerStore } from '$lib/stores/timerStore';
import { uiStateStore, initialUIState } from '$lib/stores/uiStateStore';
import { uiEffectsStore } from '$lib/stores/uiEffectsStore';
import { replayAutoPlayStore } from '$lib/stores/replayAutoPlayStore';

/**
 * Скидає всі стори до їхніх початкових значень та скасовує побічні ефекти.
 * Це ключова функція для забезпечення ізоляції тестів.
 */
export function resetAllStores() {
  // 1. Скасування активних побічних ефектів (таймери, інтервали)
  uiEffectsStore.cancelAllEffects();
  replayAutoPlayStore.cancelAllEffects();

  // 2. Скидання стану сторів
  animationStore.set(initialAnimationState);
  appSettingsStore.reset();
  availableMovesStore.set([]);
  boardStore.set(null);
  gameModeStore.set(initialGameModeState);
  gameOverStore.resetGameOverState();
  gameSettingsStore.resetSettings();
  gameStore.reset();
  playerStore.set(null);
  scoreStore.set(null);
  testModeStore.set(initialTestModeState);
  timerStore.reset();
  uiStateStore.set(initialUIState);
}