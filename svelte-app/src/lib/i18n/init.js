// svelte-app/src/lib/i18n/init.js
import { register, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { settingsStore } from '$lib/stores/settingsStore.js';
import { get } from 'svelte/store';

// Реєструємо всі мови. Svelte-i18n завантажить їх динамічно за потреби.
register('en', () => import('./en.js'));
register('uk', () => import('./uk.js'));
register('crh', () => import('./crh.js'));
register('nl', () => import('./nl.js'));

// Отримуємо початкову мову з нашого settingsStore
const initialLocale = get(settingsStore).language || getLocaleFromNavigator() || 'uk';

// Ініціалізуємо бібліотеку з початковою мовою.
// Це відбувається синхронно під час першого імпорту цього файлу.
init({
  fallbackLocale: 'uk',
  initialLocale: initialLocale,
});

// Підписуємося на зміни мови в налаштуваннях
// і оновлюємо локаль svelte-i18n реактивно.
settingsStore.subscribe((/** @type {{language?: string}} */ settings) => {
  if (settings.language) {
    locale.set(settings.language);
  }
}); 