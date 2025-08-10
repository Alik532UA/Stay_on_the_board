import { get } from 'svelte/store';
import { gameState, type GameState } from '$lib/stores/gameState';
import { getAvailableMoves } from '$lib/utils/boardUtils';
import { settingsStore } from '$lib/stores/settingsStore';
import type { MoveDirectionType } from '$lib/models/Figure';

export const computerPlayerService = {
  async makeMove(): Promise<{ direction: MoveDirectionType; distance: number } | null> {
    const state = get(gameState);
    const settings = get(settingsStore);
    const availableMoves = getAvailableMoves(
      state.playerRow,
      state.playerCol,
      state.boardSize,
      state.cellVisitCounts,
      settings.blockOnVisitCount,
      state.board,
      settings.blockModeEnabled,
      null
    );

    if (availableMoves.length === 0) {
      return null;
    }

    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    return {
      direction: randomMove.direction,
      distance: randomMove.distance
    };
  }
};