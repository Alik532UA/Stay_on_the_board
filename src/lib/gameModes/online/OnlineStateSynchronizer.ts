import { get } from 'svelte/store';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore } from '$lib/stores/scoreStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { gameOverStore, type GameOverStoreState } from '$lib/stores/gameOverStore';
import type { IGameStateSync, SyncableGameState } from '$lib/sync/gameStateSync.interface';
import { logService } from '$lib/services/logService';

export class OnlineStateSynchronizer {
    constructor(private stateSync: IGameStateSync) { }

    /**
     * Збирає поточний локальний стан і відправляє його на сервер.
     * @param overrides Додаткові поля для оновлення (наприклад, gameOver, noMovesClaim)
     */
    public async syncCurrentState(overrides: Partial<SyncableGameState> = {}): Promise<void> {
        const boardState = get(boardStore);
        const playerState = get(playerStore);
        const scoreState = get(scoreStore);
        const settings = get(gameSettingsStore);
        const gameOverState = get(gameOverStore) as GameOverStoreState;

        if (!boardState || !playerState || !scoreState) {
            logService.error('[OnlineStateSynchronizer] Cannot sync state: stores are empty');
            return;
        }

        const stateToPush: SyncableGameState = {
            boardState,
            playerState,
            scoreState,
            settings: {
                blockModeEnabled: settings.blockModeEnabled,
                autoHideBoard: settings.autoHideBoard,
                boardSize: settings.boardSize,
                turnDuration: settings.turnDuration,
                settingsLocked: settings.settingsLocked
            },
            gameOver: gameOverState.isGameOver ? gameOverState.gameResult : null,
            version: Date.now(),
            updatedAt: Date.now(),
            ...overrides
        };

        await this.stateSync.pushState(stateToPush);
    }
}