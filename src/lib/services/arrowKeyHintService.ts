import { modalStore } from '$lib/stores/modalStore';
import hotkeyService from './hotkeyService';
import SimpleModalContent from '../components/modals/SimpleModalContent.svelte';

let hasShownArrowKeyHint = false;

export function showArrowKeyHintModal() {
  if (hasShownArrowKeyHint) return;
  hasShownArrowKeyHint = true;

  const context = 'arrow-key-hint-modal';
  hotkeyService.pushContext(context);

  const closeModal = () => {
    modalStore.closeModal();
    hotkeyService.popContext(context);
  };

  modalStore.showModal({
    component: SimpleModalContent,
    variant: 'menu',
    dataTestId: 'arrow-key-hint-modal',
    props: {
      titleKey: 'modal.arrowKeyHintTitle',
      contentKey: 'modal.arrowKeyHintContent',
      actions: [
        {
          labelKey: 'modal.ok',
          variant: 'primary',
          isHot: true,
          onClick: closeModal,
          dataTestId: 'arrow-key-hint-ok-btn'
        }
      ]
    }
  });

  hotkeyService.register(context, 'Enter', closeModal);
  hotkeyService.register(context, 'Space', closeModal);
  hotkeyService.register(context, 'Escape', closeModal);
}
