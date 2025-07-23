// svelte-app/src/lib/i18n/init.js
import { register, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { settingsStore } from '$lib/stores/settingsStore.js';
import { get, writable } from 'svelte/store';

export const i18nReady = writable(false);

// Реєструємо всі мови. Svelte-i18n завантажить їх динамічно за потреби.
register('en', () => import('./en.js'));
register('uk', () => import('./uk.js'));
register('crh', () => import('./crh.js'));
register('nl', () => import('./nl.js'));

// Ця функція буде викликатися на стороні клієнта
export function initializeI18n() {
  const initialLocale = get(settingsStore).language || getLocaleFromNavigator() || 'uk';

  init({
    fallbackLocale: 'uk',
    initialLocale: initialLocale,
  });

  settingsStore.subscribe((settings) => {
    if (settings.language && get(locale) !== settings.language) {
      locale.set(settings.language);
    }
  });

  i18nReady.set(true);
} 