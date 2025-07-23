// file: svelte-app/src/lib/utils/uiHelpers.js

import { modalService } from '$lib/services/modalService.js';
import { logService } from '$lib/services/logService.js';
import { clearCache } from '$lib/utils/cacheManager.js';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import GameModeModal from '$lib/components/GameModeModal.svelte';

export function showGameModeSelector() {
  modalService.showModal({
    titleKey: 'gameModes.title',
    component: GameModeModal,
    buttons: [{ textKey: 'modal.cancel', onClick: modalService.closeModal }],
    closable: false,
  });
}

export function showGameInfoModal() {
  modalService.showModal({
    titleKey: 'faq.title',
    content: { isFaq: true },
    buttons: [
      { textKey: 'rulesPage.title', onClick: () => { goto(`${base}/rules`); modalService.closeModal(); }, customClass: 'blue-btn' },
      { textKey: 'modal.ok', primary: true, isHot: true, onClick: modalService.closeModal },
    ],
  });
}

export function showClearCacheModal() {
  modalService.showModal({
    titleKey: 'mainMenu.clearCacheModal.title',
    contentKey: 'mainMenu.clearCacheModal.content',
    buttons: [
      {
        textKey: 'mainMenu.clearCacheModal.fullClear',
        customClass: 'danger-btn',
        onClick: () => {
          logService.addLog('Повне очищення кешу', 'info');
          clearCache({ keepAppearance: false });
          modalService.closeModal();
        },
      },
      {
        textKey: 'mainMenu.clearCacheModal.keepAppearance',
        primary: true,
        isHot: true,
        onClick: () => {
          logService.addLog('Очищення кешу зі збереженням вигляду', 'info');
          clearCache({ keepAppearance: true });
          modalService.closeModal();
        },
      },
      { textKey: 'modal.cancel', onClick: modalService.closeModal },
    ],
  });
} 