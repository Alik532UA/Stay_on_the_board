// src/lib/types/notification.ts

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'achievement';

export interface Notification {
    id: string;
    type: NotificationType;
    titleKey?: string; // Translation key
    messageKey?: string; // Translation key
    messageRaw?: string; // Fallback plain text
    icon?: string;
    duration?: number; // ms, default 3000
}
