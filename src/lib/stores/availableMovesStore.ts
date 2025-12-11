import { writable } from 'svelte/store';
import type { Move } from '$lib/utils/gameUtils';

export const availableMovesStore = writable<Move[]>([]);
