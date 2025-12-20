import { gameEventBus, type ShowNoMovesModalPayload } from '$lib/services/gameEventBus';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { modalStore } from '$lib/stores/modalStore';
import { roomService } from '$lib/services/roomService';
import { timeService } from '$lib/services/timeService';
import { logService } from '$lib/services/logService';
import { uiStateStore } from '$lib/stores/uiStateStore';
import { get } from 'svelte/store';
import type { GameOverPayload } from '$lib/stores/gameOverStore';
import type { OnlineMatchController } from './OnlineMatchController';

export interface EventManagerCallbacks {
    onSyncState: (overrides?: any) => void;
    isApplyingRemoteState: () => boolean;
}

export class OnlineGameEventManager {
    private subscriptions: (() => void)[] = [];

    constructor(
        private roomId: string,
        private myPlayerId: string,
        private matchController: OnlineMatchController,
        private callbacks: EventManagerCallbacks,
        private turnDuration: number
    ) { }

    public setupSubscriptions() {
        // 1. Settings Sync
        this.subscriptions.push(
            gameSettingsStore.subscribe(settings => {
                if (!this.callbacks.isApplyingRemoteState() && this.roomId) {
                    this.callbacks.onSyncState();
                }
            })
        );

        // 2. Replay Requests
        this.subscriptions.push(
            gameEventBus.subscribe('ReplayGame', () => {
                this.matchController.handleRestartRequest();
            })
        );

        this.subscriptions.push(
            gameEventBus.subscribe('RequestReplay', () => {
                if (this.roomId && this.myPlayerId) {
                    roomService.setWatchingReplay(this.roomId, this.myPlayerId, true);
                }
            })
        );

        // 3. Modal Handling
        this.subscriptions.push(
            gameEventBus.subscribe('CloseModal', () => {
                if (this.roomId && this.myPlayerId) {
                    roomService.setWatchingReplay(this.roomId, this.myPlayerId, false);
                }
            })
        );

        this.subscriptions.push(
            modalStore.subscribe(state => {
                if (state.isOpen) {
                    logService.GAME_MODE('[OnlineEventManager] Modal opened. Pausing timer.');
                    timeService.pauseGameTimer();
                    timeService.stopTurnTimer();
                } else {
                    const uiState = get(uiStateStore);
                    if (!uiState.isGameOver && this.turnDuration > 0) {
                        logService.GAME_MODE('[OnlineEventManager] Modal closed. Resuming timer.');
                        // Тут можна додати логіку відновлення таймера
                    }
                }
            })
        );

        // 4. Game Logic Events
        this.subscriptions.push(
            gameEventBus.subscribe('ShowNoMovesModal', (payload: ShowNoMovesModalPayload & { isRemote?: boolean }) => {
                timeService.stopTurnTimer();

                if (this.myPlayerId && !payload.isRemote) {
                    logService.GAME_MODE('[OnlineEventManager] Local NoMoves claim detected. Syncing to server.');
                    this.callbacks.onSyncState({
                        noMovesClaim: {
                            playerId: this.myPlayerId,
                            scoreDetails: payload.scoreDetails,
                            boardSize: payload.boardSize,
                            timestamp: Date.now(),
                            isCorrect: true,
                            playerScores: payload.playerScores
                        }
                    });
                }
            })
        );

        this.subscriptions.push(
            gameEventBus.subscribe('GameOver', (payload: GameOverPayload) => {
                if (!this.callbacks.isApplyingRemoteState() && this.roomId) {
                    logService.GAME_MODE('[OnlineEventManager] Local GameOver detected. Syncing to server.');
                    this.callbacks.onSyncState({
                        gameOver: payload,
                        finishRequests: {},
                        continueRequests: {},
                        noMovesClaim: null,
                        noMovesVotes: {} // FIX: Очищаємо голоси тут, разом з відправкою GameOver
                    });
                }
            })
        );
    }

    public cleanup() {
        this.subscriptions.forEach(unsub => unsub());
        this.subscriptions = [];
    }
}