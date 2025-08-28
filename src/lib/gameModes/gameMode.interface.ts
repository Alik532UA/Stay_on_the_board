// src/lib/gameModes/gameMode.interface.ts
import type { GameState } from '$lib/stores/gameState';
import type { Player } from '$lib/models/player';
import type { FinalScoreDetails } from '$lib/models/score';
import type { MoveDirectionType } from '$lib/models/Figure';
import type { SideEffect } from '$lib/services/sideEffectService';

export interface IGameMode {
  turnDuration: number;
  gameDuration: number;
  initialize(options?: { newSize?: number }): void;
  handlePlayerMove(direction: MoveDirectionType, distance: number): Promise<void>;
  claimNoMoves(): Promise<void>;
  handleNoMoves(playerType: 'human' | 'computer'): Promise<void>;
  getPlayersConfiguration(): Player[];
  continueAfterNoMoves(): Promise<void>;
  restartGame(options?: { newSize?: number }): Promise<void>;
  cleanup(): void;
  pauseTimers(): void;
  resumeTimers(): void;
}