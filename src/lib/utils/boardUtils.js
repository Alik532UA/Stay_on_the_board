import { get } from 'svelte/store';

/**
 * Визначає, чи є клітинка заблокованою на основі кількості відвідувань.
 * @param {number} row - Рядок клітинки.
 * @param {number} col - Стовпець клітинки.
 * @param {{ [key: string]: number }} cellVisitCounts - Об'єкт з лічильниками відвідувань.
 * @param {import('$lib/stores/settingsStore').SettingsState} settings - Поточні налаштування гри.
 * @returns {boolean}
 */
export function isCellBlocked(row, col, cellVisitCounts, settings) {
  const visitCount = cellVisitCounts[`${row}-${col}`] || 0;
  return settings.blockModeEnabled && visitCount > settings.blockOnVisitCount;
}

/**
 * Повертає CSS-клас "пошкодження" для клітинки.
 * @param {number} row - Рядок клітинки.
 * @param {number} col - Стовпець клітинки.
 * @param {{ [key: string]: number }} cellVisitCounts - Об'єкт з лічильниками відвідувань.
 * @param {import('$lib/stores/settingsStore').SettingsState} settings - Поточні налаштування гри.
 * @returns {string}
 */
export function getDamageClass(row, col, cellVisitCounts, settings) {
  if (!settings.blockModeEnabled || settings.blockOnVisitCount === 0) return '';
  const visitCount = cellVisitCounts[`${row}-${col}`] || 0;
  if (visitCount > 0 && visitCount <= settings.blockOnVisitCount) {
    return `cell-damage-${visitCount}`;
  }
  return '';
} 