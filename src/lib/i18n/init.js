// svelte-app/src/lib/i18n/init.js
import { register, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
import { get, writable } from 'svelte/store';

export const i18nReady = writable(false);

// Реєструємо всі мови. Svelte-i18n завантажить їх динамічно за потреби.
register('en', () => import('./en.js'));
register('uk', () => import('./uk.js'));
register('crh', () => import('./crh.js'));
register('nl', () => import('./nl.js'));

// Ця функція буде викликатися на стороні клієнта
export function initializeI18n() {
  try {
    const initialLocale = get(appSettingsStore).language || getLocaleFromNavigator() || 'uk';

    init({
      fallbackLocale: 'uk',
      initialLocale: initialLocale,
    });

    appSettingsStore.subscribe((settings) => {
      if (settings.language && get(locale) !== settings.language) {
        locale.set(settings.language);
      }
    });

    i18nReady.set(true);
    console.log('✅ i18n ініціалізовано успішно');
  } catch (error) {
    console.error('❌ Помилка ініціалізації i18n:', error);
    // Навіть при помилці встановлюємо ready, щоб сайт не зависав на "Loading..."
    i18nReady.set(true);
  }
} 