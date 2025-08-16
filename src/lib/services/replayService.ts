import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { logService } from './logService';

interface ReplayData {
  moveHistory: any[];
  boardSize: number;
  gameType: string;
  modalContext: any | null;
}

export const replayService = {
  saveReplayData(gameType: string, modalContext: any = null) {
    // This function is no longer needed as replay data is managed by replayStore
    logService.ui("saveReplayData is deprecated and should not be called.");
  },

  loadReplayData(): ReplayData | null {
    // This function is no longer needed as replay data is managed by replayStore
    logService.ui("loadReplayData is deprecated and should not be called.");
    return null;
  }
};