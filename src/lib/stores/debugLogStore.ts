// src/lib/stores/debugLogStore.ts
/**
 * @file Store для зберігання дебаг-логів.
 */

import { writable } from 'svelte/store';

const logs = writable<string[]>([]);

function createLogStore() {
    const { subscribe, update, set } = logs;

    return {
        subscribe,
        add: (message: string): void => {
            update(currentLogs => {
                const newLogs = [...currentLogs, message];
                // Keep the last 100 logs to prevent memory issues
                if (newLogs.length > 100) {
                    return newLogs.slice(newLogs.length - 100);
                }
                return newLogs;
            });
        },
        clear: (): void => {
            set([]);
        }
    };
}

export const debugLogStore = createLogStore();
