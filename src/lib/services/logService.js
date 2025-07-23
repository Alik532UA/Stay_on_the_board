// logService: централізований сервіс для логування дій, помилок, подій.
import { writable } from 'svelte/store';

/**
 * @typedef {Object} LogEntry
 * @property {string} timestamp
 * @property {string} type
 * @property {string} message
 */

function createLogService() {
  /** @type {import('svelte/store').Writable<LogEntry[]>} */
  const { subscribe, update, set } = writable([]);

  /**
   * Додати запис у лог
   * @param {string} message
   * @param {string} [type]
   */
  function addLog(message, type = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    update(logs => [entry, ...logs]);
  }

  /**
   * Очистити всі логи
   */
  function clearLogs() {
    set([]);
  }

  return {
    subscribe,
    addLog,
    clearLogs
  };
}

export const logService = createLogService(); 