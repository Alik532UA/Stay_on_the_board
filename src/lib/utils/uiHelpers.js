// file: svelte-app/src/lib/utils/uiHelpers.js

import { modalStore } from '$lib/stores/modalStore.js';
import { logStore } from '$lib/stores/logStore.js';
import { clearCache } from '$lib/utils/cacheManager.js';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import GameModeModal from '$lib/components/GameModeModal.svelte';

export function showGameModeSelector() {
  modalStore.showModal({
    titleKey: 'gameModes.title',
    component: GameModeModal,
    buttons: [{ textKey: 'modal.cancel', onClick: modalStore.closeModal }],
    closable: false,
  });
}

export function showGameInfoModal() {
  modalStore.showModal({
    titleKey: 'faq.title',
    content: { isFaq: true },
    buttons: [
      { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalStore.closeModal(); }, customClass: 'blue-btn' },
      { textKey: 'modal.ok', primary: true, isHot: true, onClick: modalStore.closeModal },
    ],
  });
}

export function showClearCacheModal() {
  modalStore.showModal({
    titleKey: 'mainMenu.clearCacheModal.title',
    contentKey: 'mainMenu.clearCacheModal.content',
    buttons: [
      {
        textKey: 'mainMenu.clearCacheModal.fullClear',
        customClass: 'danger-btn',
        onClick: () => {
          logStore.addLog('Повне очищення кешу', 'info');
          clearCache({ keepAppearance: false });
          modalStore.closeModal();
        },
      },
      {
        textKey: 'mainMenu.clearCacheModal.keepAppearance',
        primary: true,
        isHot: true,
        onClick: () => {
          logStore.addLog('Очищення кешу зі збереженням вигляду', 'info');
          clearCache({ keepAppearance: true });
          modalStore.closeModal();
        },
      },
      { textKey: 'modal.cancel', onClick: modalStore.closeModal },
    ],
  });
} 