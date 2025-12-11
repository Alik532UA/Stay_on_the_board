// src/lib/sync/gameStateSync.interface.ts
import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { ScoreState } from '$lib/stores/scoreStore';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { GameOverPayload } from '$lib/stores/gameOverStore';

/**
 * Дані про заяву "Немає ходів"
 */
export interface NoMovesClaimPayload {
    playerId: string; // ID гравця, який зробив заяву
    scoreDetails: any; // Деталі рахунку
    boardSize: number;
    timestamp: number; // Для уникнення повторного відкриття
    isCorrect: boolean; // Чи була заява вірною
}

export interface SyncableGameState {
    boardState: BoardState;
    playerState: PlayerState;
    scoreState: ScoreState;
    settings?: Partial<GameSettingsState>;
    version: number;
    updatedAt: number;
    gameOver?: GameOverPayload | null;
    restartRequests?: Record<string, boolean>;

    // Синхронізація модального вікна "Немає ходів"
    noMovesClaim?: NoMovesClaimPayload | null;

    // Голосування за продовження гри (після NoMoves)
    continueRequests?: Record<string, boolean>;

    // Голосування за завершення гри з бонусом (після NoMoves)
    finishRequests?: Record<string, boolean>;
}

export interface SyncMoveData {
    playerId: number;
    direction: string;
    distance: number;
    newPosition: { row: number; col: number };
    timestamp: number;
}

export type GameStateSyncEvent =
    | { type: 'state_updated'; state: SyncableGameState }
    | { type: 'player_joined'; playerId: number; playerName: string }
    | { type: 'player_left'; playerId: number }
    | { type: 'game_started' }
    | { type: 'game_ended'; reason: string }
    | { type: 'connection_lost' }
    | { type: 'connection_restored' }
    | { type: 'game_over_sync'; payload: GameOverPayload };

export type GameStateSyncCallback = (event: GameStateSyncEvent) => void;

export interface IGameStateSync {
    readonly sessionId: string | null;
    readonly isConnected: boolean;

    initialize(sessionId?: string): Promise<void>;
    pushState(state: SyncableGameState): Promise<void>;
    pullState(): Promise<SyncableGameState | null>;
    pushMove(moveData: SyncMoveData): Promise<void>;
    subscribe(callback: GameStateSyncCallback): () => void;
    cleanup(): Promise<void>;
}