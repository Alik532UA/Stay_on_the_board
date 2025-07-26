// src/lib/services/uiService.js
import { get } from 'svelte/store';
import { settingsStore } from '$lib/stores/settingsStore.js';
import { modalStore } from '$lib/stores/modalStore.js';
import { gameState } from '$lib/stores/gameState.js';
import { resetGame } from '$lib/services/gameLogicService.js';
import GameModeModal from '$lib/components/GameModeModal.svelte';
import { navigationService } from '$lib/services/navigationService.js';

/**
 * Ініціює процес переходу до гри.
 * Перевіряє, чи потрібно показувати модальне вікно вибору режиму,
 * і або показує його, або одразу переходить до гри.
 */
export function navigateToGame() {
  // --- ЗАВЖДИ скидаємо гру для коректної ініціалізації ---
  resetGame();
  
  settingsStore.init(); // Переконуємося, що налаштування актуальні

  if (get(settingsStore).showGameModeModal) {
    modalStore.showModal({
      titleKey: 'gameModes.title',
      component: GameModeModal,
      closable: true
    });
  } else {
    const currentMode = get(settingsStore).gameMode;
    if (!currentMode) {
      // Просто викликаємо метод з пресетом за замовчуванням
      settingsStore.applyGameModePreset('beginner');
    }
    navigationService.goTo('/game');
  }
} 