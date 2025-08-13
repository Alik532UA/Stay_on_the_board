/**
 * @file Encapsulates all logic related to creating, displaying,
 * and managing modal windows.
 */
import { get } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';
import { userActionService } from './userActionService';
import { _, locale } from 'svelte-i18n';
import type { FinalScoreDetails } from '$lib/models/score';
import type { GameState } from '$lib/stores/gameState';
import { LocalGameMode } from '$lib/gameModes/LocalGameMode';

export const modalService = {
  showGameOverModal(payload: { reasonKey: string, reasonValues: any, finalScoreDetails: FinalScoreDetails, gameType: string, state: GameState }): void {
    const { reasonKey, reasonValues, finalScoreDetails, gameType, state } = payload;
    const t = get(_);
    
    let titleKey = 'modal.gameOverTitle';
    let content;

    if (gameType === 'local') {
      const { winners, winningPlayerIndex } = new LocalGameMode().determineWinner(state, reasonKey);
      const losingPlayerName = state.players[state.currentPlayerIndex].name;
      const modalReason = t(reasonKey, { values: { playerName: losingPlayerName } });
      
      const playerScores = state.players.map((player, index) => ({
        playerNumber: index + 1,
        playerName: player.name,
        score: state.scoresAtRoundStart[index],
        isWinner: winners.includes(index),
        isLoser: index === state.currentPlayerIndex
      }));

      let winnerName = '';
      let winnerNumbers = '';

      if (winners.length === 1) {
        titleKey = 'modal.winnerTitle';
        winnerName = state.players[winningPlayerIndex].name;
      } else if (winners.length > 1) {
        titleKey = 'modal.winnersTitle';
        winnerNumbers = winners.map((i: number) => state.players[i].name).join(', ');
      }
      
      content = {
        reason: modalReason,
        playerScores,
        winnerName,
        winnerNumbers,
        scoreDetails: finalScoreDetails
      };

    } else { // vs-computer
      const modalReason = t(reasonKey, reasonValues ? { values: reasonValues } : undefined);
      content = {
        reason: modalReason,
        scoreDetails: finalScoreDetails
      };
    }

    modalStore.showModal({
      titleKey,
      content,
      dataTestId: 'game-over-modal',
      titleDataTestId: 'game-over-modal-title',
      buttons: [
        { textKey: 'modal.playAgain', primary: true, onClick: () => userActionService.handleModalAction('restartGame'), isHot: true },
        { textKey: 'modal.watchReplay', customClass: 'blue-btn', onClick: () => userActionService.handleModalAction('requestReplay') }
      ]
    });
  },
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
          onClick: () => userActionService.handleModalAction('resetGame', { newSize })
        },
        { textKey: 'modal.resetScoreCancel', onClick: () => userActionService.handleModalAction('closeModal') }
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