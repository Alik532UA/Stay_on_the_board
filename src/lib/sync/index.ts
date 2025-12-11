// src/lib/sync/index.ts
/**
 * @file Експорти модуля синхронізації стану гри.
 */

export type {
    IGameStateSync,
    SyncableGameState,
    SyncMoveData,
    GameStateSyncCallback,
    GameStateSyncEvent
} from './gameStateSync.interface';

export { LocalGameStateSync, localGameStateSync } from './LocalGameStateSync';

export { FirebaseGameStateSync, createFirebaseGameStateSync } from './FirebaseGameStateSync';
