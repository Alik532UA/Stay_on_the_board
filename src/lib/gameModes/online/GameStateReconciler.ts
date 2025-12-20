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

export class GameStateReconciler {
    private lastProcessedNoMovesClaim: number = 0;

    constructor(private myPlayerId: string) { }

    public apply(remoteState: SyncableGameState): void {
        const currentBoard = get(boardStore);

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

        if (remoteState.boardState) boardStore.set(remoteState.boardState);
        if (remoteState.playerState) playerStore.set(remoteState.playerState);
        if (remoteState.scoreState) scoreStore.set(remoteState.scoreState);

        if (remoteState.settings) {
            // FIX: Застосовуємо тільки ті налаштування, які прийшли з сервера і є спільними.
            // Локальні налаштування (голос, віджети) залишаються без змін, бо їх немає в remoteState.settings
            // (завдяки змінам в OnlineStateSynchronizer).
            gameSettingsStore.updateSettings(remoteState.settings);
        }

        this.handleGameOver(remoteState);
        this.handleNoMovesClaim(remoteState);

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
            const votes = remoteState.noMovesVotes || {};
            const totalPlayers = remoteState.playerState.players.length;
            const majorityThreshold = Math.floor(totalPlayers / 2) + 1;
            const finishCount = Object.values(votes).filter(v => v === 'finish').length;

            if (finishCount >= majorityThreshold) {
                logService.GAME_MODE('[Reconciler] Ignoring missing remote GameOver because majority voted FINISH.');
                return;
            }

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
        if (!remoteState.noMovesClaim) {
            const currentModal = get(modalStore);
            if (currentModal.isOpen && (currentModal.dataTestId === 'player-no-moves-modal' || currentModal.dataTestId === 'opponent-trapped-modal')) {
                logService.GAME_MODE('[Reconciler] NoMoves claim cleared on server. Closing modal.');
                gameEventBus.dispatch('CloseModal');
            }
            return;
        }

        const claim = remoteState.noMovesClaim;

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

        this.updateModalButtonsState(remoteState);
    }

    private updateModalButtonsState(remoteState: SyncableGameState) {
        const currentModal = get(modalStore);
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

            const continueBtnText = `${t('modal.continueGame')} (${continueCount}/${totalPlayers})`;
            if (newButtons[0].text !== continueBtnText) {
                newButtons[0] = {
                    ...newButtons[0],
                    text: continueBtnText,
                    textKey: undefined,
                    disabled: false
                };
                updated = true;
            }

            const baseFinishText = t('modal.finishGameWithBonus', { values: { bonus: remoteState.noMovesClaim?.boardSize || 0 } });
            const finishBtnText = `${baseFinishText} (${finishCount}/${totalPlayers})`;

            if (newButtons[1].text !== finishBtnText) {
                newButtons[1] = {
                    ...newButtons[1],
                    text: finishBtnText,
                    textKey: undefined,
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