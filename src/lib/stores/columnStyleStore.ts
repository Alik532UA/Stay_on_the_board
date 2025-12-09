// src/lib/stores/columnStyleStore.ts
/**
 * @file Store for column style mode.
 */

import { writable } from 'svelte/store';

export type ColumnStyleMode = 'fixed' | 'flexible';

export const columnStyleMode = writable<ColumnStyleMode>('fixed');
