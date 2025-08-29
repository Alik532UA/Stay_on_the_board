// src/lib/services/replayService.ts
import { logService } from './logService';

interface ReplayData {
  moveHistory: any[];
  boardSize: number;
  gameType: string;
  modalContext: any | null;
}

export const replayService = {
  saveReplayData(gameType: string, modalContext: any = null) {
    logService.ui("saveReplayData is deprecated and should not be called.");
  },

  loadReplayData(): ReplayData | null {
    logService.ui("loadReplayData is deprecated and should not be called.");
    return null;
  }
};