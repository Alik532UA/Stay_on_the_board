import { writable } from 'svelte/store';
import { base } from '$app/paths';
import { browser } from '$app/environment'; // <-- 1. Імпортуйте 'browser'
import { logService } from '../services/logService.js';

/** @type {import('svelte/store').Writable<string | null>} */
export const appVersion = writable(null);

/**
 * Асинхронно завантажує версію з файлу version.json
 */