// src/lib/stores/notificationStore.ts
import { writable } from 'svelte/store';
import type { Notification } from '$lib/types/notification';

export const notificationStore = writable<Notification[]>([]);
