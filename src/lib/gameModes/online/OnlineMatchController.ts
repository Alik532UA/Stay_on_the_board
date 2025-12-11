import { roomService } from '$lib/services/roomService';
import { notificationService } from '$lib/services/notificationService';
import { modalService } from '$lib/services/modalService';
import { navigationService } from '$lib/services/navigationService';
import { gameEventBus } from '$lib/services/gameEventBus';
import { logService } from '$lib/services/logService';
import type { IGameStateSync, SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { get } from 'svelte/store';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { availableMovesService } from '$lib/services/availableMovesService';
import { animationService } from '$lib/services/animationService';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { modalStore } from '$lib/stores/modalStore';
import { _ } from 'svelte-i18n';

export class OnlineMatchController {
    constructor(
        private roomId: string,
        private myPlayerId: string,
        private amIHost: boolean,
        private stateSync: IGameStateSync,
        private resetBoardCallback: () => void,
        private advancePlayerCallback: () => void,
        private endGameCallback: (reason: string) => void
    ) { }

    public async handleRestartRequest(): Promise<void> {
        logService.GAME_MODE('[MatchController] Restart requested. Returning to lobby.');
        modalService.closeAllModals();
        await roomService.returnToLobby(this.roomId, this.myPlayerId);
        navigationService.goTo(`/online/lobby/${this.roomId}`);
    }

    public async handleContinueRequest(): Promise<void> {
        logService.GAME_MODE('[MatchController] Vote to CONTINUE game.');

        // Optimistic UI update: Change button text to "Waiting..."
        const t = get(_);
        modalStore.update(s => {
            if (s.isOpen && s.buttons && s.buttons.length > 0) {
                const newButtons = s.buttons.map((b, i) => {
                    // Assuming "Continue" is the first button (index 0)
                    if (i === 0) {
                        return { ...b, text: t('modal.waitingForPlayers'), disabled: true };
                    }
                    return b;
                });
                return { ...s, buttons: newButtons };
            }
            return s;
        });

        const currentState = await this.stateSync.pullState();
        const currentRequests = currentState?.continueRequests || {};
        const newRequests = { ...currentRequests, [this.myPlayerId]: true };

        await this.syncState({ continueRequests: newRequests });

        this.checkConsensus({ ...currentState, continueRequests: newRequests } as SyncableGameState);
    }

    public async handleFinishRequest(): Promise<void> {
        logService.GAME_MODE('[MatchController] Vote to FINISH game.');

        // Optimistic UI update: Change button text to "Waiting..."
        const t = get(_);
        modalStore.update(s => {
            if (s.isOpen && s.buttons && s.buttons.length > 1) {
                const newButtons = s.buttons.map((b, i) => {
                    // Assuming "Finish" is the second button (index 1)
                    if (i === 1) {
                        return { ...b, text: t('modal.waitingForPlayers'), disabled: true };
                    }
                    return b;
                });
                return { ...s, buttons: newButtons };
            }
            return s;
        });

        const currentState = await this.stateSync.pullState();
        const currentRequests = currentState?.finishRequests || {};
        const newRequests = { ...currentRequests, [this.myPlayerId]: true };

        await this.syncState({ finishRequests: newRequests });

        this.checkConsensus({ ...currentState, finishRequests: newRequests } as SyncableGameState);
    }

    public checkConsensus(state: SyncableGameState) {
        // 1. Перевірка голосів за ПРОДОВЖЕННЯ
        if (state.continueRequests) {
            const requests = state.continueRequests;
            const allReady = Object.keys(requests).length >= 2;

            if (allReady) {
                logService.GAME_MODE('[MatchController] Consensus reached: CONTINUE game.');

                // FIX AC #11 & #12: Тільки Хост генерує новий стан дошки ТА гравців і пушить його на сервер.
                if (this.amIHost) {
                    logService.GAME_MODE('[MatchController] I am Host. Resetting board/player state and pushing to server.');

                    // Генеруємо новий стан дошки (логіка взята з resetBoardForContinuation)
                    const currentBoard = get(boardStore);
                    if (currentBoard) {
                        const newBoardState = {
                            ...currentBoard,
                            cellVisitCounts: {},
                            moveHistory: [{
                                pos: { row: currentBoard.playerRow!, col: currentBoard.playerCol! },
                                blocked: [] as { row: number; col: number }[], // FIX: Явна типізація
                                visits: {},
                                blockModeEnabled: get(gameSettingsStore).blockModeEnabled
                            }],
                            moveQueue: [] as any[], // FIX: Явна типізація
                        };

                        // Оновлюємо локально (щоб Хост бачив зміни миттєво)
                        this.resetBoardCallback();
                        this.advancePlayerCallback(); // Це оновлює playerStore локально

                        // Отримуємо оновлений стан гравців після advancePlayerCallback
                        const newPlayerState = get(playerStore);

                        // FIX: Explicitly close modal for Host to ensure UI unblocks immediately
                        gameEventBus.dispatch('CloseModal');

                        // Пушимо повний стан на сервер (включаючи playerState!)
                        this.syncState({
                            boardState: newBoardState,
                            playerState: newPlayerState!, // <--- ВАЖЛИВО: Синхронізуємо зміну черги ходу
                            continueRequests: {},
                            finishRequests: {},
                            noMovesClaim: null
                        });
                    }
                } else {
                    // Гість просто чекає оновлення від сервера.
                }
            }
        }

        // 2. Перевірка голосів за ЗАВЕРШЕННЯ
        if (state.finishRequests) {
            const requests = state.finishRequests;
            const allReady = Object.keys(requests).length >= 2;

            if (allReady) {
                logService.GAME_MODE('[MatchController] Consensus reached: FINISH game.');

                if (!state.gameOver) {
                    if (this.amIHost) {
                        // FIX AC #14: Хост ініціює завершення гри локально.
                        // OnlineGameMode перехопить подію GameOver і відправить її на сервер
                        // разом з очищенням прапорців (finishRequests).
                        // Ми НЕ викликаємо syncState тут, щоб уникнути гонки станів.
                        this.endGameCallback('modal.gameOverReasonBonus');
                    }
                }
            }
        }
    }

    public checkVotes(remoteState: SyncableGameState) {
        this.checkConsensus(remoteState);
    }

    private async syncState(overrides: Partial<SyncableGameState>) {
        const currentState = await this.stateSync.pullState();
        if (currentState) {
            await this.stateSync.pushState({
                ...currentState,
                ...overrides,
                updatedAt: Date.now()
            });
        }
    }
}