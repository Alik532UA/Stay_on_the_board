import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type { Notification } from '$lib/types/notification';

function createNotificationStore() {
    const { subscribe, update, set } = writable<Notification[]>([]);

    return {
        subscribe,
        add: (notificationData: Omit<Notification, 'id'>) => {
            const id = uuidv4();
            const notification: Notification = { ...notificationData, id };
            
            update(n => [...n, notification]);

            const duration = notification.duration ?? 5000;
            if (duration > 0) {
                setTimeout(() => {
                    update(n => n.filter(item => item.id !== id));
                }, duration);
            }
            return id;
        },
        remove: (id: string) => {
            update(n => n.filter(item => item.id !== id));
        },
        update, // Added for backward compatibility with existing service
        clear: () => set([])
    };
}

export const notificationStore = createNotificationStore();
