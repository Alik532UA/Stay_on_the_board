import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<string[]>} */
const logs = writable([]);

function createLogStore() {
  const { subscribe, update } = logs;

  return {
    subscribe,
    /**
     * @param {string} message
     */
    add: (message) => {
      update(currentLogs => {
        const newLogs = [...currentLogs, message];
        // Keep the last 100 logs to prevent memory issues
        if (newLogs.length > 100) {
          return newLogs.slice(newLogs.length - 100);
        }
        return newLogs;
      });
    },
    clear: () => {
      logs.set([]);
    }
  };
}

export const debugLogStore = createLogStore();
