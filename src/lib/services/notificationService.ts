// src/lib/services/notificationService.ts
import { notificationStore } from '$lib/stores/notificationStore';
import type { Notification } from '$lib/types/notification';
import { v4 as uuidv4 } from 'uuid';

class NotificationService {
    show(notificationData: Omit<Notification, 'id'>) {
        const id = uuidv4();
        const notification: Notification = {
            ...notificationData,
            id,
        };

        notificationStore.update(n => [...n, notification]);

        // Auto-remove
        const duration = notification.duration || 3000;
        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    remove(id: string) {
        notificationStore.update(n => n.filter(item => item.id !== id));
    }
}

export const notificationService = new NotificationService();
