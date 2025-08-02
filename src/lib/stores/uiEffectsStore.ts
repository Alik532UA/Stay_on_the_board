import { writable, get } from 'svelte/store';
import { settingsStore } from './settingsStore.js';

/**
 * Store для централізованого керування побічними ефектами UI (таймери, затримки, автоприховування тощо).
 */

function createUiEffectsStore() {
  let autoHideTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Автоматично приховати дошку після зміни позиції фігури.
   * @param delayMs - затримка у мілісекундах (за замовчуванням 0)
   */
  function autoHideBoard(delayMs = 0) {
    if (autoHideTimeout) clearTimeout(autoHideTimeout);
    autoHideTimeout = setTimeout(() => {
      if (get(settingsStore).showBoard) {
        settingsStore.toggleShowBoard(false);
      }
    }, delayMs);
  }

  return {
    autoHideBoard
  };
}

export const uiEffectsStore = createUiEffectsStore(); 