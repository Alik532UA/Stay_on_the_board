// src/lib/stores/isModalOpenStore.ts
/**
 * @file Derived store for modal open state.
 */

import { derived } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';

export const isModalOpen = derived(
    modalStore,
    ($modalStore) => $modalStore.isOpen
);
