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

    // 1. Оновлюємо ключовий стан
    uiStateStore.update(s => s ? ({ ...s, isGameOver: true, gameOverReasonKey: reasonKey, gameOverReasonValues: reasonValues }) : null);
    timeService.stopGameTimer();
    timeService.stopTurnTimer();

    // 2. Чекаємо оновлення Svelte
    await tick();

    // 3. Отримуємо АКТУАЛЬНИЙ стан
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

    // 4. Розраховуємо фінальний рахунок
    const finalScoreDetails = calculateFinalScore(boardState, playerState, scoreState, uiState, gameType);
    logService.score('[endGameService] Final score calculated:', finalScoreDetails);

    // 5. Оновлюємо рахунок гравців (крім local/online, де він ведеться окремо)
    if (gameType !== 'local' && gameType !== 'online') {
      const humanPlayer = playerState.players.find(p => p.type === 'human');
      if (humanPlayer) {
        const updatedPlayers = playerState.players.map(p =>
          p.id === humanPlayer.id ? { ...p, score: finalScoreDetails.totalScore } : p
        );
        playerStore.set({ ...playerState, players: updatedPlayers });
      }
    }

    scoreStore.set(initialScoreState);

    // 6. Визначаємо переможця
    const finalPlayerState = get(playerStore)!;
    const { winners, loser } = determineWinner(finalPlayerState, reasonKey, playerState.currentPlayerIndex);

    let finalReasonKey = reasonKey;
    const finalReasonValues = { ...reasonValues };

    // FIX: Підміна ключів для мультиплеєра (щоб не писало "Ви", а писало ім'я)
    if ((gameType === 'local' || gameType === 'online') && loser) {
      if (reasonKey === 'modal.gameOverReasonOut') {
        finalReasonKey = 'modal.gameOverReasonPlayerOut';
      } else if (reasonKey === 'modal.gameOverReasonBlocked') {
        finalReasonKey = 'modal.gameOverReasonPlayerBlocked';
      }
      // Для 'modal.gameOverReasonPlayerLied' ключ залишається, але треба переконатись, що є ім'я
      finalReasonValues.playerName = loser.name;
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
  }
};