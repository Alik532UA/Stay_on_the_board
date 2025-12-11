import { get } from 'svelte/store';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { animationService } from '$lib/services/animationService';
import { availableMovesService } from '$lib/services/availableMovesService';
import { gameEventBus } from '$lib/services/gameEventBus';
import { modalService } from '$lib/services/modalService';
import { modalStore } from '$lib/stores/modalStore';
import { speakMove } from '$lib/services/speechService';
import { appSettingsStore, type AppSettingsState } from '$lib/stores/appSettingsStore';
import { logService } from '$lib/services/logService';
import type { SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { _ } from 'svelte-i18n';
import { timeService } from '$lib/services/timeService';

/**
 * Відповідає за узгодження (reconciliation) локального стану з віддаленим станом сервера.
 * Реалізує принцип UDF: Server State -> Local Stores -> UI.
 */
export class GameStateReconciler {
    private lastProcessedNoMovesClaim: number = 0;

    constructor(private myPlayerId: string) { }

    /**
     * Застосовує віддалений стан до локальних сторів.
     */
    public apply(remoteState: SyncableGameState): void {
        const currentBoard = get(boardStore);

        // 1. Обробка анімацій та черги ходів
        if (currentBoard && remoteState.boardState) {
            // Якщо історія зменшилась - це рестарт гри
            if (remoteState.boardState.moveHistory.length < currentBoard.moveHistory.length) {
                logService.GAME_MODE('[Reconciler] Detected game reset. Resetting animation service.');
                animationService.reset();
            }

            // Якщо з'явилися нові ходи - додаємо в анімацію та озвучуємо
            const oldQueueLength = currentBoard.moveQueue.length;
            const newQueueLength = remoteState.boardState.moveQueue.length;

            if (newQueueLength > oldQueueLength) {
                const newMoves = remoteState.boardState.moveQueue.slice(oldQueueLength);
                newMoves.forEach(move => {
                    gameEventBus.dispatch('new_move_added', move);
                    this.handleOpponentVoiceover(move);
                });
            }
        }

        // 2. Оновлення основних сторів (SSoT)
        if (remoteState.boardState) boardStore.set(remoteState.boardState);
        if (remoteState.playerState) playerStore.set(remoteState.playerState);
        if (remoteState.scoreState) scoreStore.set(remoteState.scoreState);

        // 3. Оновлення налаштувань
        if (remoteState.settings) {
            gameSettingsStore.updateSettings(remoteState.settings);
        }

        // 4. Обробка Game Over
        this.handleGameOver(remoteState);

        // 5. Обробка заяви "Немає ходів"
        this.handleNoMovesClaim(remoteState);

        // 6. Фіналізація
        availableMovesService.updateAvailableMoves();
    }

    /**
     * Озвучує хід, якщо його зробив суперник.
     */
    private handleOpponentVoiceover(move: any) {
        const movePlayerIndex = move.player - 1;
        const myIndex = get(uiStateStore).onlinePlayerIndex;
        const settings = get(gameSettingsStore);

        // Перевіряємо, чи це хід суперника і чи увімкнено озвучення для нього
        if (movePlayerIndex !== myIndex && settings.speechEnabled && settings.speechFor.onlineOpponentMove) {
            logService.speech(`[Reconciler] Speaking opponent move: ${move.direction} ${move.distance}`);
            speakMove(
                { direction: move.direction, distance: move.distance },
                (get(appSettingsStore) as AppSettingsState).language || 'uk',
                settings.selectedVoiceURI,
                undefined,
                true // force: true, бо ми вже перевірили умови тут
            );
        }
    }

    /**
     * Синхронізує стан завершення гри.
     */
    private handleGameOver(remoteState: SyncableGameState) {
        if (remoteState.gameOver) {
            const currentGameOver = get(gameOverStore);
            uiStateStore.update(s => ({ ...s, isGameOver: true }));

            // Показуємо модалку тільки якщо вона ще не показана
            if (!currentGameOver.isGameOver) {
                logService.GAME_MODE('[Reconciler] Syncing GameOver state from server');
                gameOverStore.setGameOver(remoteState.gameOver);
                modalService.showGameOverModal(remoteState.gameOver!);
            }
        } else {
            // Якщо на сервері гра активна, а у нас Game Over - скидаємо
            uiStateStore.update(s => ({ ...s, isGameOver: false }));
            const currentGameOver = get(gameOverStore);
            if (currentGameOver.isGameOver) {
                logService.GAME_MODE('[Reconciler] Clearing local GameOver state');
                gameOverStore.resetGameOverState();
                modalService.closeAllModals();
            }
        }
    }

    /**
     * Обробляє заяву про відсутність ходів та оновлює UI модалки.
     */
    private handleNoMovesClaim(remoteState: SyncableGameState) {
        // Якщо noMovesClaim зник (став null), а модалка відкрита - закриваємо її
        if (!remoteState.noMovesClaim) {
            const currentModal = get(modalStore);
            if (currentModal.isOpen && (currentModal.dataTestId === 'player-no-moves-modal' || currentModal.dataTestId === 'opponent-trapped-modal')) {
                logService.GAME_MODE('[Reconciler] NoMoves claim cleared on server. Closing modal.');
                gameEventBus.dispatch('CloseModal');
            }
            return;
        }

        const claim = remoteState.noMovesClaim;

        // Якщо це нова заява - показуємо модалку
        if (claim.timestamp > this.lastProcessedNoMovesClaim) {
            logService.GAME_MODE('[Reconciler] Processing NoMoves claim. Showing modal for ALL players.');
            this.lastProcessedNoMovesClaim = claim.timestamp;

            timeService.stopTurnTimer();

            // Використовуємо 'human' тип, щоб показати "Блискучий аналіз" для всіх (текст нейтральний)
            gameEventBus.dispatch('ShowNoMovesModal', {
                playerType: 'human',
                scoreDetails: claim.scoreDetails,
                boardSize: claim.boardSize,
                // @ts-ignore
                isRemote: true
            });
        }

        // Оновлення стану кнопок у відкритій модалці (відображення "Очікування...")
        this.updateModalButtonsState(remoteState);
    }

    private updateModalButtonsState(remoteState: SyncableGameState) {
        const currentModal = get(modalStore);
        if (currentModal.isOpen && currentModal.dataTestId === 'player-no-moves-modal') {
            const t = get(_);
            const newButtons = [...currentModal.buttons];
            let updated = false;

            // Кнопка "Продовжити" (індекс 0)
            if (remoteState.continueRequests && remoteState.continueRequests[this.myPlayerId]) {
                if (!newButtons[0].disabled) {
                    newButtons[0] = {
                        ...newButtons[0],
                        text: t('modal.waitingForPlayers'),
                        disabled: true
                    };
                    updated = true;
                }
            }

            // Кнопка "Завершити" (індекс 1)
            if (remoteState.finishRequests && remoteState.finishRequests[this.myPlayerId]) {
                if (!newButtons[1].disabled) {
                    newButtons[1] = {
                        ...newButtons[1],
                        text: t('modal.waitingForPlayers'),
                        disabled: true
                    };
                    updated = true;
                }
            }

            if (updated) {
                modalStore.update(s => ({ ...s, buttons: newButtons }));
            }
        }
    }
}