// src/lib/stores/versionStore.ts
/**
 * @file Store для версії додатку.
 */

import { writable } from 'svelte/store';

export const appVersion = writable<string | null>(null);
