// src/lib/stores/layoutUpdateStore.ts
/**
 * @file Store for triggering layout updates.
 */

import { writable } from 'svelte/store';

export const layoutUpdateStore = writable<number>(0);
