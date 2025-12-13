import type { Achievement, RewardConditionContext } from '$lib/types/rewards';
import { rewardsStore } from '$lib/stores/rewardsStore';
import { get } from 'svelte/store';
import { logService } from './logService';
import { notificationService } from './notificationService';

// Розширена структура для майбутнього
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
    icon: 'handshake',
    condition: (context: RewardConditionContext) => {
      return context.score >= 5 && (context.gameMode === 'local' || context.gameMode?.includes('local'));
    }
  }
  // ТУТ ЛЕГКО ДОДАВАТИ НОВІ НАГОРОДИ
  // Наприклад:
  // {
  //   id: 'arena_survivor',
  //   titleKey: 'rewards.arenaSurvivor.title',
  //   ...
  //   condition: (ctx) => ctx.gameMode === 'arena' && ctx.score > 20
  // }
];

class RewardsService {
  constructor() { }

  init() {
    rewardsStore.init();
  }

  /**
   * Перевіряє досягнення.
   * @param context Контекст гри (рахунок, режим, розмір дошки тощо)
   */
  checkAchievements(context: { score: number; gameMode: string; boardSize?: number }) {
    const state = get(rewardsStore);

    ACHIEVEMENTS.forEach(achievement => {
      if (state.unlockedRewards[achievement.id]) return;

      if (achievement.condition(context)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  private unlockAchievement(achievement: Achievement) {
    rewardsStore.unlock(achievement.id);

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