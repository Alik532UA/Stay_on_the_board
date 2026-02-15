import { writable, get } from 'svelte/store';
import { gameSettingsStore } from './gameSettingsStore.js';
import { logService } from '$lib/services/logService.js';
import { uiStateStore } from './uiStateStore.js';
import { gameEventBus } from '$lib/services/gameEventBus';

/**
 * Store для централізованого керування побічними ефектами UI (таймери, затримки, автоприховування тощо).
 */

function createUiEffectsStore() {
  let autoHideTimeout: ReturnType<typeof setTimeout> | null = null;
  let unsubscribers: (() => void)[] = [];

  /**
   * Автоматично приховати дошку після зміни позиції фігури.
   * @param delayMs - затримка у мілісекундах (за замовчуванням 0)
   */
  // Централізована ізоляція побічних ефектів (таймери) для автоприховування, забезпечуючи UDF і SoC з gameState
  function autoHideBoard(delayMs = 0, forceHide = true) {
    if (autoHideTimeout) clearTimeout(autoHideTimeout);

    logService.ui(`Автоприховування дошки запущено з затримкою ${delayMs}ms, forceHide: ${forceHide}`);

    autoHideTimeout = setTimeout(() => {
      const settings = get(gameSettingsStore);
      if (settings.autoHideBoard && (settings.showBoard === forceHide)) {
        gameSettingsStore.toggleShowBoard(!forceHide);
        if (forceHide) {
            uiStateStore.update(s => ({ ...s, showBoardHiddenInfo: true }));
        }
      }
    }, delayMs);
  }

  function cancelAllEffects() {
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout);
      autoHideTimeout = null;
    }
  }

  return {
    autoHideBoard,
    cancelAllEffects,
    initEventListeners: () => {
      unsubscribers.forEach(u => u());
      unsubscribers = [
        gameEventBus.subscribe('UI_REQUEST_HIDE_BOARD', (payload) => {
          autoHideBoard(payload.delay);
        })
      ];
    },
    destroy: () => {
      unsubscribers.forEach(u => u());
      unsubscribers = [];
    }
  };
}

export const uiEffectsStore = createUiEffectsStore(); 
