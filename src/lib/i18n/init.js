// svelte-app/src/lib/i18n/init.js
import { register, init, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
import { get, writable } from 'svelte/store';

export const i18nReady = writable(false);

// Register all languages
register('en', () => import('./en.js'));
register('uk', () => import('./uk.js'));
register('crh', () => import('./crh.js'));
register('nl', () => import('./nl.js'));

// This function will be called on the client side
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
    console.log('✅ i18n initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing i18n:', error);
    // Even on error, set ready to avoid UI freeze
    i18nReady.set(true);
  }
}
