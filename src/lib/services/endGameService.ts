// src/lib/services/endGameService.ts
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

export const endGameService = {
  async endGame(reasonKey: string, reasonValues: Record<string, any> | null = null): Promise<void> {
    logService.GAME_MODE(`[endGameService] endGame called with reason: '${reasonKey}'`);

    // 1. Оновлюємо ключовий стан, від якого залежить розрахунок
    uiStateStore.update(s => s ? ({ ...s, isGameOver: true, gameOverReasonKey: reasonKey, gameOverReasonValues: reasonValues }) : null);
    timeService.stopGameTimer();
    timeService.stopTurnTimer();

    // 2. Чекаємо, доки Svelte оновить стан
    await tick();
    logService.score('[endGameService] Svelte tick completed after setting gameOver state.');

    // 3. Отримуємо АКТУАЛЬНИЙ стан після оновлення
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

    // 4. Розраховуємо фінальний рахунок на основі АКТУАЛЬНОГО стану
    logService.score('[endGameService] Calculating final score with states:', {
      playerScore: playerState.players.find(p => p.type === 'human')?.score,
      noMovesBonus: scoreState.noMovesBonus,
      finishBonus: uiState.gameOverReasonKey === 'modal.gameOverReasonBonus' ? boardState.boardSize : 0,
      reasonKey: uiState.gameOverReasonKey
    });
    const finalScoreDetails = calculateFinalScore(boardState, playerState, scoreState, uiState, gameType);
    logService.score('[endGameService] Final score calculated:', finalScoreDetails);

    // 5. Оновлюємо залежні стори
    // ВАЖЛИВО: Для локальної та онлайн гри ми НЕ перезаписуємо рахунок гравців глобальною сумою.
    // У цих режимах рахунок кожного гравця ведеться окремо в playerStore (див. LocalGameMode.ts).
    if (gameType !== 'local' && gameType !== 'online') {
      const humanPlayer = playerState.players.find(p => p.type === 'human');
      if (humanPlayer) {
        const updatedPlayers = playerState.players.map(p =>
          p.id === humanPlayer.id ? { ...p, score: finalScoreDetails.totalScore } : p
        );
        playerStore.set({ ...playerState, players: updatedPlayers });
        logService.score(`[endGameService] playerStore updated. New score: ${finalScoreDetails.totalScore}`);
      }
    }

    scoreStore.set(initialScoreState);
    logService.score('[endGameService] scoreStore has been reset.');

    // 6. Визначаємо переможця і показуємо модальне вікно
    const finalPlayerState = get(playerStore)!;
    const { winners, loser } = determineWinner(finalPlayerState, reasonKey, playerState.currentPlayerIndex);

    let finalReasonKey = reasonKey;
    const finalReasonValues = { ...reasonValues };

    if (gameType === 'local' && loser) {
      if (reasonKey === 'modal.gameOverReasonOut') {
        finalReasonKey = 'modal.gameOverReasonPlayerOut';
      } else if (reasonKey === 'modal.gameOverReasonBlocked') {
        finalReasonKey = 'modal.gameOverReasonPlayerBlocked';
      }

      if (finalReasonKey !== reasonKey) {
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

    logService.score('[endGameService] Dispatching GameOver event with payload:', gameOverPayload);
    gameOverStore.setGameOver(gameOverPayload);
    gameEventBus.dispatch('GameOver', { ...gameOverPayload, state: { ...boardState, ...finalPlayerState, ...get(scoreStore)!, ...uiState } });
  }
};
