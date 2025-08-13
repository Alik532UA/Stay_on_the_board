/**
 * @file Encapsulates all logic related to creating, displaying,
 * and managing modal windows.
 */
import { get } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';
import * as gameLogicService from '$lib/services/gameLogicService.js';
import { gameState } from '$lib/stores/gameState';

export const modalService = {
  /**
   * Shows a confirmation modal for resetting the score when changing board size.
   * @param newSize - The new board size.
   */
  showResetScoreConfirmation(newSize: number): void {
    modalStore.showModal({
      titleKey: 'modal.resetScoreTitle',
      contentKey: 'modal.resetScoreContent',
      dataTestId: 'board-resize-confirm-modal',
      titleDataTestId: 'modal-window-title',
      buttons: [
        {
          textKey: 'modal.resetScoreConfirm',
          customClass: 'green-btn',
          isHot: true,
          onClick: () => {
            gameLogicService.resetGame({ newSize }, get(gameState));
            modalStore.closeModal();
          }
        },
        { textKey: 'modal.resetScoreCancel', onClick: modalStore.closeModal }
      ]
    });
  },

  /**
   * Closes the currently active modal.
   */
  closeModal(): void {
    modalStore.closeModal();
  },

  /**
   * Gets the current context of the modal for serialization.
   * @returns The serializable modal context or null if the modal is not open.
   */
  getCurrentModalContext() {
    const modalState = get(modalStore);
    if (!modalState.isOpen) return null;

    const serializableButtons = modalState.buttons.map(btn => {
      let action = null;
      if (btn.onClick) {
        const onClickString = btn.onClick.toString();
        if (onClickString.includes('continueAfterNoMoves')) action = 'continueAfterNoMoves';
        else if (onClickString.includes('finalizeGameWithBonus')) action = 'finalizeGameWithBonus';
        else if (onClickString.includes('startReplay')) action = 'startReplay';
        else if (onClickString.includes('restartGame')) action = 'playAgain';
      }
      return {
        textKey: btn.textKey,
        text: btn.text,
        customClass: btn.customClass,
        isHot: btn.isHot,
        action: action,
        bonus: (btn as any).bonus
      };
    });

    return {
      titleKey: modalState.titleKey,
      content: modalState.content,
      buttons: serializableButtons,
      closable: modalState.closable
    };
  }
};