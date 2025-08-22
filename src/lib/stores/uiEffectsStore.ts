import { writable, get } from 'svelte/store';
import { settingsStore } from './settingsStore.js';
import { logService } from '$lib/services/logService.js';

/**
 * Store для централізованого керування побічними ефектами UI (таймери, затримки, автоприховування тощо).
 */

function createUiEffectsStore() {
  let autoHideTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Автоматично приховати дошку після зміни позиції фігури.
   * @param delayMs - затримка у мілісекундах (за замовчуванням 0)
   */
  // Централізована ізоляція побічних ефектів (таймери) для автоприховування, забезпечуючи UDF і SoC з gameState
  function autoHideBoard(delayMs = 0, forceHide = true) {
    if (autoHideTimeout) clearTimeout(autoHideTimeout);

    logService.ui(`Автоприховування дошки запущено з затримкою ${delayMs}ms, forceHide: ${forceHide}`);

    autoHideTimeout = setTimeout(() => {
      const settings = get(settingsStore);
      if (settings.autoHideBoard && (settings.showBoard === forceHide)) {
        settingsStore.toggleShowBoard(!forceHide);
      }
    }, delayMs);
  }

  return {
    autoHideBoard
  };
}

export const uiEffectsStore = createUiEffectsStore(); 