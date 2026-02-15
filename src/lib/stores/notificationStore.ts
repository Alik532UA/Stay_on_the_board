// src/lib/stores/notificationStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — notificationState.svelte.ts (Runes).

import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type { Notification } from '$lib/types/notification';
import { notificationState } from './notificationState.svelte';

function createNotificationStore() {
    const { subscribe, set: svelteSet } = writable<Notification[]>(notificationState.state);

    const syncStore = () => { svelteSet(notificationState.state); };

    return {
        subscribe,
        add: (notificationData: Omit<Notification, 'id'>) => {
            const id = uuidv4();
            const notification: Notification = { ...notificationData, id };

            notificationState.add(notification);
            syncStore();

            // Побічний ефект (таймер) залишається в bridge
            const duration = notification.duration ?? 5000;
            if (duration > 0) {
                setTimeout(() => {
                    notificationState.remove(id);
                    syncStore();
                }, duration);
            }
            return id;
        },
        remove: (id: string) => {
            notificationState.remove(id);
            syncStore();
        },
        update: (fn: (s: Notification[]) => Notification[]) => {
            notificationState.state = fn(notificationState.state);
            syncStore();
        },
        clear: () => {
            notificationState.clear();
            syncStore();
        }
    };
}

export const notificationStore = createNotificationStore();
