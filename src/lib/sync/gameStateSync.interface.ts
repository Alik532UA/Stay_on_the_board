// src/lib/sync/gameStateSync.interface.ts
import type { BoardState } from '$lib/stores/boardStore';
import type { PlayerState } from '$lib/stores/playerStore';
import type { ScoreState } from '$lib/stores/scoreStore';
import type { GameSettingsState } from '$lib/stores/gameSettingsStore';
import type { GameOverPayload, PlayerScoreResult } from '$lib/stores/gameOverStore';

/**
 * Дані про заяву "Немає ходів"
 */
export interface NoMovesClaimPayload {
    playerId: string;
    scoreDetails: any;
    boardSize: number;
    timestamp: number;
    isCorrect: boolean;
    playerScores?: Array<PlayerScoreResult & { playerName: string; playerColor: string; isWinner?: boolean; isLoser?: boolean }>;
}

/**
 * Тип голосу гравця
 */
export type VoteType = 'continue' | 'finish';

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

    // Єдине джерело правди для голосування (PlayerID -> VoteType)
    noMovesVotes?: Record<string, VoteType>;
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

    // FIX: Новий метод для атомарного оновлення голосу
    updateVote(playerId: string, vote: VoteType): Promise<void>;

    subscribe(callback: GameStateSyncCallback): () => void;
    cleanup(): Promise<void>;
}