import { get } from 'svelte/store';
import { gameOverStore } from '$lib/stores/gameOverStore';
import { calculateFinalScore, determineWinner } from './scoreService';
import { gameEventBus } from './gameEventBus';
import { logService } from './logService';
import { timeService } from './timeService';
import { boardStore } from '$lib/stores/boardStore';
import { playerStore } from '$lib/stores/playerStore';
import { scoreStore, initialScoreState } from '$lib/stores/scoreStore';
import { uiStateStore } from '$lib/stores/uiStateStore';
import type { Player } from '$lib/models/player';
import { tick } from 'svelte';
import { gameModeService } from './gameModeService';
import { leaderboardService } from './leaderboardService';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { authService } from './authService';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { getFirebaseApp } from './firebaseService';
import { rewardsService } from './rewardsService';

export const endGameService = {
  // FIX: Додано параметр specificPlayerIndex для явного вказання гравця, що програв/ініціював завершення
  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null, specificPlayerIndex?: number): Promise<void> {
    // FIX: Запобігаємо повторному виклику, якщо гра вже завершена.
    if (get(uiStateStore).isGameOver) {
      logService.GAME_MODE(`[endGameService] Game already over. Ignoring duplicate call for reason: '${reasonKey}'`);
      return;
    }

    logService.GAME_MODE(`[endGameService] endGame called with reason: '${reasonKey}', specificPlayerIndex: ${specificPlayerIndex}`);

    uiStateStore.update(s => s ? ({ ...s, isGameOver: true, gameOverReasonKey: reasonKey, gameOverReasonValues: reasonValues }) : null);
    timeService.stopGameTimer();
    timeService.stopTurnTimer();

    await tick();

    const boardState = get(boardStore);
    const playerState = get(playerStore);
    const scoreState = get(scoreStore);
    const uiState = get(uiStateStore);

    if (!boardState || !playerState || !scoreState || !uiState) {
      logService.score('[endGameService] Aborted: one or more stores are not available.');
      return;
    }

    const currentGameMode = gameModeService.getCurrentMode();
    const gameType = currentGameMode ? currentGameMode.getModeName() : 'training';

    const finalScoreDetails = calculateFinalScore(boardState, playerState, scoreState, uiState, gameType);
    logService.score('[endGameService] Final score calculated:', finalScoreDetails);

    if (gameType !== 'local' && gameType !== 'online') {
      const humanPlayer = playerState.players.find(p => p.type === 'human');
      if (humanPlayer) {
        const updatedPlayers = playerState.players.map(p =>
          p.id === humanPlayer.id ? { ...p, score: finalScoreDetails.totalScore } : p
        );
        playerStore.set({ ...playerState, players: updatedPlayers });

        logService.score('[endGameService] Submitting score to leaderboard...');

        let cleanMode = gameType;
        if (gameType === 'virtual-player') {
          const preset = get(gameSettingsStore).gameMode;
          if (preset && preset.includes('timed')) cleanMode = 'timed';
          else cleanMode = 'training';
        }

        leaderboardService.submitScore(finalScoreDetails.totalScore, {
          mode: cleanMode,
          size: boardState.boardSize
        });

        logService.score('[endGameService] Checking achievements with final score...');
        rewardsService.checkAchievements({
          score: finalScoreDetails.totalScore,
          gameMode: cleanMode,
          boardSize: boardState.boardSize
        });

        this.saveLastPlayedInfo(cleanMode, boardState.boardSize, finalScoreDetails.totalScore);
      }
    }

    scoreStore.set(initialScoreState);

    const finalPlayerState = get(playerStore)!;

    // FIX: Визначаємо індекс гравця для логіки перемоги/поразки.
    const playerIndexForLogic = specificPlayerIndex !== undefined ? specificPlayerIndex : playerState.currentPlayerIndex;

    const { winners, loser } = determineWinner(finalPlayerState, reasonKey, playerIndexForLogic);

    let finalReasonKey = reasonKey;
    const finalReasonValues = { ...reasonValues };

    // Логіка формування повідомлення про причину завершення
    if (gameType === 'local' || gameType === 'online') {
      // Якщо це Cash Out (дострокове завершення), додаємо ім'я ініціатора
      if (reasonKey === 'modal.gameOverReasonCashOut') {
        const initiator = finalPlayerState.players[playerIndexForLogic];
        if (initiator) {
          finalReasonValues.playerName = initiator.name;
        }
      }
      // Якщо є переможений (вихід за межі, блокування), додаємо його ім'я
      else if (loser) {
        if (reasonKey === 'modal.gameOverReasonOut') {
          finalReasonKey = 'modal.gameOverReasonPlayerOut';
        } else if (reasonKey === 'modal.gameOverReasonBlocked') {
          finalReasonKey = 'modal.gameOverReasonPlayerBlocked';
        }
        finalReasonValues.playerName = loser.name;
      }
    }

    const gameOverPayload = {
      scores: finalPlayerState.players.map((p: Player) => ({ playerId: p.id, score: p.score, name: p.name, color: p.color })),
      winners: winners,
      loser: loser,
      reasonKey: finalReasonKey,
      reasonValues: finalReasonValues,
      finalScoreDetails,
      gameType: gameType,
    };

    logService.score('[endGameService] Dispatching GameOver event:', gameOverPayload);
    gameOverStore.setGameOver(gameOverPayload);

    // @ts-ignore
    gameEventBus.dispatch('GameOver', { ...gameOverPayload, state: { ...boardState, ...finalPlayerState, ...get(scoreStore)!, ...uiState } });
  },

  async saveLastPlayedInfo(mode: string, size: number, score: number) {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      const db = getFirestore(getFirebaseApp());
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastPlayed: {
          mode,
          size,
          score,
          timestamp: Date.now()
        }
      });
    } catch (e) {
      console.warn('Failed to save last played info', e);
    }
  }
};