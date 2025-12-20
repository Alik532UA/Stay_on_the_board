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

    public apply(remoteState: SyncableGameState): void {
        const currentBoard = get(boardStore);

        // 1. Обробка анімацій та черги ходів
        if (currentBoard && remoteState.boardState) {
            if (remoteState.boardState.moveHistory.length < currentBoard.moveHistory.length) {
                logService.GAME_MODE('[Reconciler] Detected game reset. Resetting animation service.');
                animationService.reset();
            }

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

        // 5. Обробка заяви "Немає ходів" та голосування
        this.handleNoMovesClaim(remoteState);

        // 6. Фіналізація
        availableMovesService.updateAvailableMoves();
    }

    private handleOpponentVoiceover(move: any) {
        const movePlayerIndex = move.player - 1;
        const myIndex = get(uiStateStore).onlinePlayerIndex;
        const settings = get(gameSettingsStore);

        if (movePlayerIndex !== myIndex && settings.speechEnabled && settings.speechFor.onlineOpponentMove) {
            logService.speech(`[Reconciler] Speaking opponent move: ${move.direction} ${move.distance}`);
            speakMove(
                { direction: move.direction, distance: move.distance },
                (get(appSettingsStore) as AppSettingsState).language || 'uk',
                settings.selectedVoiceURI,
                undefined,
                true
            );
        }
    }

    private handleGameOver(remoteState: SyncableGameState) {
        if (remoteState.gameOver) {
            const currentGameOver = get(gameOverStore);
            uiStateStore.update(s => ({ ...s, isGameOver: true }));

            if (!currentGameOver.isGameOver) {
                logService.GAME_MODE('[Reconciler] Syncing GameOver state from server');
                gameOverStore.setGameOver(remoteState.gameOver);
                modalService.showGameOverModal(remoteState.gameOver!);
            }
        } else {
            uiStateStore.update(s => ({ ...s, isGameOver: false }));
            const currentGameOver = get(gameOverStore);
            if (currentGameOver.isGameOver) {
                logService.GAME_MODE('[Reconciler] Clearing local GameOver state');
                gameOverStore.resetGameOverState();
                modalService.closeAllModals();
            }
        }
    }

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

        // Якщо це нова заява - відкриваємо модалку
        if (claim.timestamp > this.lastProcessedNoMovesClaim) {
            logService.GAME_MODE('[Reconciler] Processing NoMoves claim. Showing modal for ALL players.');
            this.lastProcessedNoMovesClaim = claim.timestamp;

            timeService.stopTurnTimer();

            gameEventBus.dispatch('ShowNoMovesModal', {
                playerType: 'human',
                scoreDetails: claim.scoreDetails,
                boardSize: claim.boardSize,
                playerScores: claim.playerScores,
                // @ts-ignore
                isRemote: true
            });
        }

        // Оновлюємо стан кнопок (лічильники голосів)
        this.updateModalButtonsState(remoteState);
    }

    /**
     * Динамічно оновлює текст кнопок у модальному вікні на основі голосів.
     */
    private updateModalButtonsState(remoteState: SyncableGameState) {
        const currentModal = get(modalStore);
        // Перевіряємо, чи відкрита потрібна модалка
        if (currentModal.isOpen && (currentModal.dataTestId === 'player-no-moves-modal' || currentModal.dataTestId === 'opponent-trapped-modal')) {
            const t = get(_);
            const votes = remoteState.noMovesVotes || {};
            const totalPlayers = remoteState.playerState.players.length;

            let continueCount = 0;
            let finishCount = 0;

            Object.values(votes).forEach(v => {
                if (v === 'continue') continueCount++;
                if (v === 'finish') finishCount++;
            });

            const newButtons = [...currentModal.buttons];
            let updated = false;

            // Кнопка "Продовжити" (індекс 0)
            const continueBtnText = `${t('modal.continueGame')} (${continueCount}/${totalPlayers})`;
            if (newButtons[0].text !== continueBtnText) {
                newButtons[0] = {
                    ...newButtons[0],
                    text: continueBtnText,
                    textKey: undefined, // FIX: Видаляємо textKey, щоб Modal використовував text
                    disabled: false
                };
                updated = true;
            }

            // Кнопка "Завершити" (індекс 1)
            const baseFinishText = t('modal.finishGameWithBonus', { values: { bonus: remoteState.noMovesClaim?.boardSize || 0 } });
            const finishBtnText = `${baseFinishText} (${finishCount}/${totalPlayers})`;

            if (newButtons[1].text !== finishBtnText) {
                newButtons[1] = {
                    ...newButtons[1],
                    text: finishBtnText,
                    textKey: undefined, // FIX: Видаляємо textKey для надійності
                    disabled: false
                };
                updated = true;
            }

            if (updated) {
                logService.modal(`[Reconciler] Updating modal buttons: Continue=${continueCount}, Finish=${finishCount}`);
                modalStore.update(s => ({ ...s, buttons: newButtons }));
            }
        }
    }
}