// src/lib/gameModes/gameMode.interface.ts
import type { Player } from '$lib/models/player';
import type { MoveDirectionType } from '../models/Piece';

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