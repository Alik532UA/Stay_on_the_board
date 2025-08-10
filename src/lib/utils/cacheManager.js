/**
 * @typedef {Object} ClearCacheOptions
 * @property {boolean} [keepAppearance=false] - Зберегти тему, стиль та мову.
 * @property {boolean} [keepSettings=false] - Зберегти всі налаштування гри.
 */

/**
 * Очищує localStorage, зберігаючи вказані ключі.
 * @param {ClearCacheOptions} [options={}]
 */
export function clearCache(options = {}) {
  const keysToKeep = new Set();

  if (options.keepAppearance) {
    keysToKeep.add('theme');
    keysToKeep.add('style');
    keysToKeep.add('lang');
  }

  if (options.keepSettings) {
    // Додайте сюди ключі налаштувань, які потрібно зберегти
    keysToKeep.add('showMoves');
    keysToKeep.add('showBoard');
    keysToKeep.add('speechEnabled');
    keysToKeep.add('selectedVoiceURI');
    keysToKeep.add('blockModeEnabled');
    keysToKeep.add('showPiece');
    keysToKeep.add('blockOnVisitCount');
    keysToKeep.add('keybindings');
    keysToKeep.add('keyConflictResolution');
  }

  // Збираємо всі ключі, які потрібно видалити
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.has(key)) {
      keysToRemove.push(key);
    }
  }

  // Видаляємо ключі
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Перезавантажуємо сторінку, щоб застосувати зміни
  location.reload();
} 