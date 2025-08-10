import { get } from 'svelte/store';
import { gameState } from '$lib/stores/gameState';
import { localGameStore } from '$lib/stores/localGameStore';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { logService } from './logService';

export const replayService = {
  saveReplayData(gameType: string) {
    const state = get(gameState);
    if (state.moveHistory && state.moveHistory.length > 0) {
      const replayData = {
        moveHistory: state.moveHistory,
        boardSize: state.boardSize,
        gameType: gameType
      };

      try {
        sessionStorage.setItem('replayGameState', JSON.stringify(state));
        if (gameType === 'local') {
          sessionStorage.setItem('replayLocalGameState', JSON.stringify(get(localGameStore)));
        }
        sessionStorage.setItem('replayGameOverState', JSON.stringify(get(gameOverStore)));
        sessionStorage.setItem('replayData', JSON.stringify(replayData));
      } catch (error) {
        logService.ui("Failed to save replay data:", error);
      }
    } else {
      logService.ui("saveReplayData called with no move history.");
    }
  },

  loadReplayData() {
    const replayDataJSON = sessionStorage.getItem('replayData');
    if (replayDataJSON) {
      try {
        const replayData = JSON.parse(replayDataJSON);
        const replayGameStateJSON = sessionStorage.getItem('replayGameState');
        if (replayGameStateJSON) {
          gameState.set(JSON.parse(replayGameStateJSON));
          sessionStorage.removeItem('replayGameState');
        }

        if (replayData.gameType === 'local') {
          const replayLocalGameStateJSON = sessionStorage.getItem('replayLocalGameState');
          if (replayLocalGameStateJSON) {
            localGameStore.restoreState(JSON.parse(replayLocalGameStateJSON));
            sessionStorage.removeItem('replayLocalGameState');
          }
        }

        const replayGameOverStateJSON = sessionStorage.getItem('replayGameOverState');
        if (replayGameOverStateJSON) {
          gameOverStore.restoreState(JSON.parse(replayGameOverStateJSON));
          sessionStorage.removeItem('replayGameOverState');
        }

        sessionStorage.removeItem('replayData');
        return replayData;
      } catch (error) {
        logService.ui("Failed to load replay data:", error);
        return null;
      }
    }
    return null;
  }
};