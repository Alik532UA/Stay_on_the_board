import { logService } from './logService';
import { notificationStore } from '$lib/stores/notificationStore';

export interface ErrorOptions {
    context?: string;
    showToast?: boolean;
    userMessageKey?: string;
    userMessageRaw?: string;
}

class ErrorHandlerService {
    /**
     * Централізована обробка помилок.
     */
    public handle(error: unknown, options: ErrorOptions = {}): void {
        const { context, showToast = true, userMessageKey = 'common.errorOccurred', userMessageRaw } = options;
        
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        // 1. Логування для розробника
        logService.error(`${context ? '[' + context + '] ' : ''}${message}`, { error, stack });

        // 2. Сповіщення користувача
        if (showToast) {
            notificationStore.add({
                type: 'error',
                messageKey: userMessageRaw ? undefined : userMessageKey,
                messageRaw: userMessageRaw,
                duration: 7000
            });
        }

        // 3. Відправка на зовнішні сервіси (майбутнє)
        if (import.meta.env.PROD) {
            // TODO: sendToErrorReporting(error, context);
        }
    }

    /**
     * Глобальний перехоплювач для window.onerror та unhandledrejection.
     */
    public initGlobalHandlers(): void {
        if (typeof window === 'undefined') return;

        window.onerror = (message, source, lineno, colno, error) => {
            this.handle(error || message, { context: 'WindowOnError' });
        };

        window.onunhandledrejection = (event) => {
            this.handle(event.reason, { context: 'UnhandledRejection' });
        };
    }
}

export const errorHandlerService = new ErrorHandlerService();
