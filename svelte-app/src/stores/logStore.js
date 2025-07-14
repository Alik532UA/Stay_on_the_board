import { writable } from 'svelte/store';

/**
 * @typedef {Object} LogEntry
 * @property {string} timestamp
 * @property {string} type
 * @property {string} message
 */

function createLogStore() {
  /** @type {import('svelte/store').Writable<LogEntry[]>} */
  const { subscribe, update, set } = writable([]);

  /**
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

  function clearLogs() {
    set([]);
  }

  return {
    subscribe,
    addLog,
    clearLogs
  };
}

export const logStore = createLogStore(); 