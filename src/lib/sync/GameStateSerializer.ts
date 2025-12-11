import { logService } from '$lib/services/logService';
import type { SyncableGameState } from './gameStateSync.interface';

export class GameStateSerializer {
    /**
     * Готує стан для відправки у Firestore.
     * Серіалізує складні об'єкти (дошка, gameOver) у JSON-рядки.
     */
    static serialize(state: SyncableGameState): any {
        // Глибоке копіювання
        const stateToSync = JSON.parse(JSON.stringify(state));

        // Серіалізація дошки (масив масивів)
        if (stateToSync.boardState && stateToSync.boardState.board) {
            stateToSync.boardState.board = JSON.stringify(stateToSync.boardState.board);
        }

        // Серіалізація gameOver (уникнення вкладених масивів)
        if (stateToSync.gameOver) {
            stateToSync.gameOverSerialized = JSON.stringify(stateToSync.gameOver);
            delete stateToSync.gameOver;
        }

        return stateToSync;
    }

    /**
     * Відновлює стан з Firestore.
     * Десеріалізує JSON-рядки назад у об'єкти.
     */
    static deserialize(remoteData: any): SyncableGameState | null {
        if (!remoteData) return null;

        const state = { ...remoteData } as SyncableGameState;

        // Десеріалізація дошки
        if (state.boardState && typeof state.boardState.board === 'string') {
            try {
                state.boardState.board = JSON.parse(state.boardState.board);
            } catch (e) {
                logService.error('[GameStateSerializer] Failed to parse board state', e);
            }
        }

        // Десеріалізація gameOver
        // @ts-ignore
        if (state.gameOverSerialized) {
            try {
                // @ts-ignore
                state.gameOver = JSON.parse(state.gameOverSerialized);
                // @ts-ignore
                delete state.gameOverSerialized;
            } catch (e) {
                logService.error('[GameStateSerializer] Failed to parse gameOver state', e);
            }
        }

        return state;
    }
}