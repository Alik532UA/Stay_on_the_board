import { register, init, addMessages, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment';

import uk from './uk.js'; // Synchronous import for SSR

register('uk', () => import('./uk.js'));
register('en', () => import('./en.js'));
register('crh', () => import('./crh.js'));
register('nl', () => import('./nl.js'));

// Synchronously add fallback locale messages for SSR
if (!browser) {
  addMessages('uk', uk);
}

init({
  fallbackLocale: 'uk',
  initialLocale: browser ? getLocaleFromNavigator() : 'uk'
}); 