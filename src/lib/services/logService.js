// logService: централізований сервіс для логування дій, помилок, подій.
import { writable } from 'svelte/store';

/**
 * @typedef {Object} LogEntry
 * @property {string} timestamp
 * @property {string} type
 * @property {string} message
 * @property {Object} [data]
 */

function createLogService() {
  /** @type {import('svelte/store').Writable<LogEntry[]>} */
  const { subscribe, update, set } = writable([]);

  /**
   * Додати запис у лог
   * @param {string} message
   * @param {string} [type]
   * @param {Object} [data]
   */
  function addLog(message, type = 'info', data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      ...(data && { data })
    };
    update(logs => [entry, ...logs]);
  }

  /**
   * Додати інформаційний запис
   * @param {string} message
   * @param {Object} [data]
   */
  function info(message, data = null) {
    addLog(message, 'info', data);
  }

  /**
   * Додати попередження
   * @param {string} message
   * @param {Object} [data]
   */
  function warn(message, data = null) {
    addLog(message, 'warn', data);
  }

  /**
   * Додати помилку
   * @param {string} message
   * @param {Object} [data]
   */
  function error(message, data = null) {
    addLog(message, 'error', data);
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
    info,
    warn,
    error,
    clearLogs
  };
}

export const logService = createLogService(); 