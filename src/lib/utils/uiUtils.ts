import { get } from 'svelte/store';
import { gameSettingsStore, type GameSettingsState } from '$lib/stores/gameSettingsStore.js';
import { logService } from '$lib/services/logService.js';

// НАВІЩО: Гарантуємо, що всі візуальні опції (showBoard, showPiece, showMoves) будуть активовані для коректного UX при старті нової гри.
export function enableAllGameCheckboxesIfNeeded() {
  logService.ui('enableAllGameCheckboxesIfNeeded called');
  const s = get(gameSettingsStore);
  
  // НАВІЩО (Архітектурне виправлення): Замість трьох окремих викликів, які
  // провокували три оновлення стору, ми збираємо всі зміни в один об'єкт
  // і робимо одне атомарне оновлення. Це покращує продуктивність і
  // відповідає принципу DRY.
  const settingsToUpdate: Partial<GameSettingsState> = {};

  if (!s.showBoard) {
    settingsToUpdate.showBoard = true;
  }
  if (!s.showPiece) {
    settingsToUpdate.showPiece = true;
  }
  // Якщо showPiece був вимкнений, showMoves міг автоматично вимкнутись, тому перевіряємо його теж
  if (!s.showMoves) {
    settingsToUpdate.showMoves = true;
  }

  if (Object.keys(settingsToUpdate).length > 0) {
    gameSettingsStore.updateSettings(settingsToUpdate);
  }
}