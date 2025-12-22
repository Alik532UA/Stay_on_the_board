import { modalStore } from '$lib/stores/modalStore';
import { logService } from '$lib/services/logService.js';
import { clearCache } from '$lib/utils/cacheManager.js';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import GameModeModal from '$lib/components/GameModeModal.svelte';
import FAQModal from '$lib/components/FAQModal.svelte';
import SimpleModalContent from '$lib/components/modals/SimpleModalContent.svelte';


export function showGameModeSelector() {
  modalStore.showModal({
    dataTestId: 'game-mode-modal',
    component: GameModeModal,
    variant: 'menu',
    buttons: [],
    closeOnOverlayClick: true,
  });
}

export function showGameInfoModal() {
  modalStore.showModal({
    dataTestId: 'faq-modal',
    component: FAQModal,
    variant: 'menu',
    buttons: [],
    closeOnOverlayClick: true,
    props: {
      onOk: () => modalStore.closeModal(),
      onRules: () => {
        goto(`${base}/rules`);
        modalStore.closeModal();
      }
    }
  });
}

export function showClearCacheModal() {
  modalStore.showModal({
    component: SimpleModalContent,
    variant: 'menu',
    dataTestId: 'clear-cache-modal',
    props: {
      titleKey: 'mainMenu.clearCacheModal.title',
      contentKey: 'mainMenu.clearCacheModal.content',
      actions: [
        {
          labelKey: 'mainMenu.clearCacheModal.fullClear',
          variant: 'danger',
          onClick: () => {
            logService.ui('Повне очищення кешу', 'info');
            clearCache({ keepAppearance: false });
            modalStore.closeModal();
          },
          dataTestId: 'full-clear-cache-btn'
        },
        {
          labelKey: 'mainMenu.clearCacheModal.keepAppearance',
          variant: 'primary',
          onClick: () => {
            logService.ui('Очищення кешу зі збереженням вигляду', 'info');
            clearCache({ keepAppearance: true });
            modalStore.closeModal();
          },
          dataTestId: 'keep-appearance-clear-cache-btn'
        },
        {
          labelKey: 'modal.cancel',
          onClick: () => modalStore.closeModal(),
          dataTestId: 'cancel-clear-cache-btn'
        }
      ]
    }
  });
}

