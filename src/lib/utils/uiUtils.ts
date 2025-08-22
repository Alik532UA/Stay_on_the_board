import { get } from 'svelte/store';
import { settingsStore } from '$lib/stores/settingsStore.js';

// НАВІЩО: Гарантуємо, що всі візуальні опції (showBoard, showPiece, showMoves) будуть активовані для коректного UX при старті нової гри.
export function enableAllGameCheckboxesIfNeeded() {
  const s = get(settingsStore);
  let changed = false;
  if (!s.showBoard) { settingsStore.toggleShowBoard(true); changed = true; }
  if (!s.showPiece) { settingsStore.toggleShowPiece(); changed = true; }
  if (!s.showMoves) { settingsStore.toggleShowMoves(); changed = true; }
  // Якщо showPiece був вимкнений, showMoves міг автоматично вимкнутись, тому ще раз вмикаємо
  if (!get(settingsStore).showMoves) { settingsStore.toggleShowMoves(); }
}