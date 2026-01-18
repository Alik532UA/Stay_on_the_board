/**
 * @file Клієнтські хуки SvelteKit для обробки помилок.
 * @description Перехоплює всі необроблені помилки на клієнті.
 * У dev-режимі виводить детальну інформацію в консоль.
 *
 * Архітектура:
 * - SSoT: Централізована точка обробки всіх клієнтських помилок.
 * - SoC: Тільки обробка помилок, без бізнес-логіки.
 * - Ізоляція побічних ефектів: Всі "брудні" операції (console) ізольовані тут.
 */

import type { HandleClientError } from "@sveltejs/kit";

/**
 * Глобальний обробник клієнтських помилок.
 * Перехоплює помилки, які не були оброблені в компонентах.
 *
 * @param error - Об'єкт помилки
 * @param event - Об'єкт події з інформацією про запит
 * @returns Об'єкт з повідомленням для відображення користувачу
 */
export const handleError: HandleClientError = ({ error, event }) => {
    const isDev = import.meta.env.DEV;
    const errorId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Отримуємо повідомлення та стек
    const errorMessage =
        error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // У dev-режимі виводимо повну інформацію
    if (isDev) {
        console.group(`🔴 [MindStep Error] ${errorId}`);
        console.error("Timestamp:", timestamp);
        console.error("URL:", event.url.href);
        console.error("Route:", event.route.id);
        console.error("Message:", errorMessage);
        if (errorStack) {
            console.error("Stack:", errorStack);
        }
        console.groupEnd();
    }

    // Повертаємо об'єкт помилки для відображення в +error.svelte
    // У dev-режимі включаємо стек, в production — тільки повідомлення
    return {
        message: isDev
            ? errorMessage
            : "Сталася непередбачена помилка. Спробуйте оновити сторінку.",
        // Додаємо стек тільки в dev-режимі
        ...(isDev && errorStack ? { stack: errorStack } : {}),
    };
};
