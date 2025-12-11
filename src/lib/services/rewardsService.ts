// src/lib/services/rewardsService.ts
import type { Achievement, RewardConditionContext } from '$lib/types/rewards';
import { rewardsStore } from '$lib/stores/rewardsStore';
import { get } from 'svelte/store';
import { logService } from './logService';
import { notificationService } from './notificationService';

// Hardcoded definitions for the initial request
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score_11_any',
    titleKey: 'rewards.score11Any.title',
    descriptionKey: 'rewards.score11Any.description',
    icon: 'trophy_bronze',
    condition: (context: RewardConditionContext) => {
      return context.score >= 11;
    }
  },
  {
    id: 'score_11_timed',
    titleKey: 'rewards.score11Timed.title',
    descriptionKey: 'rewards.score11Timed.description',
    icon: 'stopwatch_gold',
    condition: (context: RewardConditionContext) => {
      return context.score >= 11 && (context.gameMode === 'timed' || context.gameMode?.includes('timed'));
    }
  },
  {
    id: 'score_5_local',
    titleKey: 'rewards.score5Local.title',
    descriptionKey: 'rewards.score5Local.description',
    icon: 'handshake', // Assuming we have or will add this icon
    condition: (context: RewardConditionContext) => {
      return context.score >= 5 && (context.gameMode === 'local' || context.gameMode?.includes('local'));
    }
  }
];

class RewardsService {
  constructor() { }

  init() {
    rewardsStore.init();
  }

  checkAchievements(context: { score: number; gameMode: string }) {
    const state = get(rewardsStore);

    ACHIEVEMENTS.forEach(achievement => {
      // If already unlocked, skip
      if (state.unlockedRewards[achievement.id]) return;

      if (achievement.condition(context)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  private unlockAchievement(achievement: Achievement) {
    rewardsStore.unlock(achievement.id);

    // Trigger generic notification (can be handled by UI component)
    // We can emit an event or update a store that the UI consumes
    // For simplicity, let's assume we have a simple event bus or store for notifications

    // Use a custom event dispatch or a new notification store.
    // Let's use a simple custom event on window for now to keep it decoupled, 
    // or better, a 'notificationStore' if we want a robust Toast system.
    // I will assume we will create a notificationStore next.

    notificationService.show({
      type: 'achievement',
      titleKey: achievement.titleKey,
      icon: achievement.icon,
      duration: 4000
    });

    logService.info(`[RewardsService] Achievement unlocked: ${achievement.id}`);
  }
}

export const rewardsService = new RewardsService();
