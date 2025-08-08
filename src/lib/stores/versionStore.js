import { writable } from 'svelte/store';
import { base } from '$app/paths';
import { browser } from '$app/environment'; // <-- 1. Імпортуйте 'browser'
import { logService } from '../services/logService.js';

/** @type {import('svelte/store').Writable<string | null>} */
export const appVersion = writable(null);

/**
 * Асинхронно завантажує версію з файлу version.json
 */
export async function loadVersion() {
  // <-- 2. Додайте цю перевірку
  if (!browser) {
    appVersion.set('?.?.?'); // Встановлюємо заглушку на сервері
    return;
  }
  try {
    const response = await fetch(`${base}/version.json?v=${new Date().getTime()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch version.json');
    }
    const data = await response.json();
    appVersion.set(data.version);
  } catch (error) {
    logService.init('Could not load app version:', error);
    appVersion.set('?.?.?'); // Встановлюємо заглушку в разі помилки
  }
}

// Запускаємо завантаження версії при першому імпорті стору
loadVersion();