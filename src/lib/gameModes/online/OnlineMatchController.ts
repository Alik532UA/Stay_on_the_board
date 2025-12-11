import { roomService } from '$lib/services/roomService';
import { notificationService } from '$lib/services/notificationService';
import { modalService } from '$lib/services/modalService';
import { navigationService } from '$lib/services/navigationService';
import { gameEventBus } from '$lib/services/gameEventBus';
import { logService } from '$lib/services/logService';
import type { IGameStateSync, SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { get } from 'svelte/store';
import { boardStore } from '$lib/stores/boardStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { availableMovesService } from '$lib/services/availableMovesService';
import { animationService } from '$lib/services/animationService';
import { gameOverStore } from '$lib/stores/gameOverStore';

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

        const currentState = await this.stateSync.pullState();
        const currentRequests = currentState?.continueRequests || {};
        const newRequests = { ...currentRequests, [this.myPlayerId]: true };

        await this.syncState({ continueRequests: newRequests });

        this.checkConsensus({ ...currentState, continueRequests: newRequests } as SyncableGameState);
    }

    public async handleFinishRequest(): Promise<void> {
        logService.GAME_MODE('[MatchController] Vote to FINISH game.');

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

                // FIX AC #11: Тільки Хост генерує новий стан дошки і пушить його на сервер.
                // Гість отримає оновлення через Reconciler.
                if (this.amIHost) {
                    logService.GAME_MODE('[MatchController] I am Host. Resetting board state and pushing to server.');

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
                        this.advancePlayerCallback();

                        // Пушимо повний стан на сервер
                        this.syncState({
                            boardState: newBoardState, // <--- ВАЖЛИВО: Відправляємо очищену дошку
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
                        this.endGameCallback('modal.gameOverReasonBonus');
                        this.syncState({
                            continueRequests: {},
                            finishRequests: {},
                            noMovesClaim: null
                        });
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