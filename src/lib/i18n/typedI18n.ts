import { derived, get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import type { TranslationKey } from '$lib/types/i18n';

/**
 * Типізована обгортка над svelte-i18n.
 * Дозволяє використовувати переклади з перевіркою ключів на етапі компіляції.
 */
export const t = derived(_, ($_): ((key: TranslationKey, vars?: Record<string, any>) => string) => {
    return (key: TranslationKey, vars?: Record<string, any>) => $_(key, { values: vars }) as string;
});

/**
 * Функція для отримання перекладу поза Svelte-компонентами (через get).
 */
export function getTranslation(key: TranslationKey, vars?: Record<string, any>): string {
    const translate = get(_);
    return translate(key, { values: vars }) as string;
}
