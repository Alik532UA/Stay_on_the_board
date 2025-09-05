import { modalStore, type ModalState } from '$lib/stores/modalStore';

function showGameOverModal(payload: any) {
  modalStore.showModal({
    component: 'GameOverModal',
    props: payload,
    closable: false,
    closeOnOverlayClick: false,
    dataTestId: 'game-over-modal'
  });
}

function showBoardResizeModal(newSize: number) {
    modalStore.showModal({
        titleKey: 'modal.boardResizeTitle',
        contentKey: 'modal.boardResizeContent',
        props: { newSize },
        buttons: [
            {
                textKey: 'modal.confirm',
                primary: true,
                onClick: () => {
                    // Placeholder for resize logic
                }
            },
            {
                textKey: 'modal.cancel',
                onClick: () => modalStore.closeModal()
            }
        ],
        dataTestId: 'board-resize-modal'
    });
}

export const modalService = {
  showModal: modalStore.showModal,
  closeModal: modalStore.closeModal,
  showGameOverModal,
  showBoardResizeModal,
  subscribe: modalStore.subscribe
};
