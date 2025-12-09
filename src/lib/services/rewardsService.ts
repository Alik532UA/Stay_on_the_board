// src/lib/services/rewardsService.ts
/**
 * @file Сервіс для керування системою нагород.
 * @description Слухає події гри через gameEventBus та оновлює rewardsStore.
 * Це SSoT для логіки перевірки та присвоєння нагород.
 */

import { get } from 'svelte/store';
import { gameEventBus, type RewardEventPayloads } from './gameEventBus';
import { rewardsStore, REWARD_DEFINITIONS, type RewardDefinition } from '$lib/stores/rewardsStore';
import { logService } from './logService';

/**
 * Статистика поточної сесії для відстеження streaks.
 */
interface SessionStats {
  gamesPlayed: number;
  currentWinStreak: number;
  totalJumpsThisGame: number;
}

class RewardsService {
  private sessionStats: SessionStats = {
    gamesPlayed: 0,
    currentWinStreak: 0,
    totalJumpsThisGame: 0
  };

  private unsubscribers: (() => void)[] = [];

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Ініціалізує слухачів подій.
   */
  private initializeEventListeners(): void {
    // Слухаємо завершення ходу
    this.unsubscribers.push(
      gameEventBus.subscribe('MOVE_COMPLETED', (payload) => {
        this.handleMoveCompleted(payload);
      })
    );

    // Слухаємо завершення гри
    this.unsubscribers.push(
      gameEventBus.subscribe('GAME_FINISHED', (payload) => {
        this.handleGameFinished(payload);
      })
    );

    // Слухаємо досягнення milestone рахунку
    this.unsubscribers.push(
      gameEventBus.subscribe('SCORE_MILESTONE_REACHED', (payload) => {
        this.handleScoreMilestone(payload);
      })
    );

    // Слухаємо серії стрибків
    this.unsubscribers.push(
      gameEventBus.subscribe('JUMP_STREAK_ACHIEVED', (payload) => {
        this.handleJumpStreak(payload);
      })
    );

    logService.init('[RewardsService] Event listeners initialized');
  }

  /**
   * Обробляє подію завершення ходу.
   */
  private handleMoveCompleted(payload: RewardEventPayloads['MOVE_COMPLETED']): void {
    // Оновлюємо лічильник стрибків
    if (payload.jumpedBlockedCells > 0) {
      this.sessionStats.totalJumpsThisGame += payload.jumpedBlockedCells;

      // Перевіряємо нагороду за стрибки
      this.checkReward('jumps_10', this.sessionStats.totalJumpsThisGame);
    }

    // Перевіряємо нагороди за рахунок
    this.checkScoreRewards(payload.newScore);
  }

  /**
   * Обробляє подію завершення гри.
   */
  private handleGameFinished(payload: RewardEventPayloads['GAME_FINISHED']): void {
    this.sessionStats.gamesPlayed++;

    // Перевіряємо нагороду за кількість ігор
    this.checkReward('games_10', this.sessionStats.gamesPlayed);

    // Оновлюємо streak перемог
    if (payload.isWinner) {
      this.sessionStats.currentWinStreak++;
      this.checkReward('win_streak_3', this.sessionStats.currentWinStreak);
    } else {
      this.sessionStats.currentWinStreak = 0;
    }

    // Перевіряємо нагороду expert player для training mode
    if (payload.gameMode === 'training' && payload.finalScore > 532) {
      rewardsStore.unlockReward('score_532');
    }

    // Скидаємо статистику гри
    this.sessionStats.totalJumpsThisGame = 0;

    logService.init('[RewardsService] Game finished', {
      gamesPlayed: this.sessionStats.gamesPlayed,
      winStreak: this.sessionStats.currentWinStreak
    });
  }

  /**
   * Обробляє подію досягнення milestone.
   */
  private handleScoreMilestone(payload: RewardEventPayloads['SCORE_MILESTONE_REACHED']): void {
    const milestoneRewardId = `score_${payload.milestone}`;
    rewardsStore.unlockReward(milestoneRewardId);
  }

  /**
   * Обробляє подію серії стрибків.
   */
  private handleJumpStreak(payload: RewardEventPayloads['JUMP_STREAK_ACHIEVED']): void {
    this.checkReward('jumps_10', payload.streakCount);
  }

  /**
   * Перевіряє та оновлює прогрес конкретної нагороди.
   */
  private checkReward(rewardId: string, currentValue: number): void {
    rewardsStore.updateProgress(rewardId, currentValue);
  }

  /**
   * Перевіряє нагороди за рахунок.
   */
  private checkScoreRewards(score: number): void {
    const scoreMilestones = [100, 250, 532];

    for (const milestone of scoreMilestones) {
      if (score >= milestone) {
        const rewardId = `score_${milestone}`;
        rewardsStore.updateProgress(rewardId, score);
      }
    }
  }

  /**
   * Очищає слухачів подій.
   */
  cleanup(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    logService.init('[RewardsService] Cleaned up');
  }

  /**
   * Скидає статистику сесії.
   */
  resetSessionStats(): void {
    this.sessionStats = {
      gamesPlayed: 0,
      currentWinStreak: 0,
      totalJumpsThisGame: 0
    };
  }
}

export const rewardsService = new RewardsService();