import { derived } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';

/**
 * A derived store that indicates if a modal is currently open.
 * @type {import('svelte/store').Readable<boolean>}
 */
export const isModalOpen = derived(
  modalStore,
  ($modalStore) => $modalStore.isOpen
);