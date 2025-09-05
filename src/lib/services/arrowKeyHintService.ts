import { modalStore } from '$lib/stores/modalStore';
import hotkeyService from './hotkeyService';

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
    titleKey: 'modal.arrowKeyHintTitle',
    contentKey: 'modal.arrowKeyHintContent',
    buttons: [
      {
        textKey: 'modal.ok',
        primary: true,
        isHot: true,
        onClick: closeModal,
      },
    ],
    dataTestId: 'arrow-key-hint-modal',
  });

  hotkeyService.register(context, 'Enter', closeModal);
  hotkeyService.register(context, 'Space', closeModal);
  hotkeyService.register(context, 'Escape', closeModal);
}
