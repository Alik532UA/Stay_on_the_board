import type { Achievement, RewardConditionContext } from '$lib/types/rewards';
import { rewardsStore } from '$lib/stores/rewardsStore';
import { get } from 'svelte/store';
import { logService } from './logService';
import { notificationService } from './notificationService';

// Базові нагороди
const BASE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score_11_any',
    titleKey: 'rewards.score11Any.title',
    descriptionKey: 'rewards.score11Any.description',
    icon: 'trophy', // Було trophy_bronze
    condition: (context: RewardConditionContext) => {
      return context.score >= 11;
    }
  },
  {
    id: 'score_5_local',
    titleKey: 'rewards.score5Local.title',
    descriptionKey: 'rewards.score5Local.description',
    icon: 'busts_in_silhouette', // Замінено з handshake, оскільки його немає в Noto
    condition: (context: RewardConditionContext) => {
      return context.score >= 5 && (context.gameMode === 'local' || context.gameMode?.includes('local'));
    }
  }
];

const BOARD_SIZES = [2, 3, 4, 5, 6, 7, 8, 9];

// 1. Спринтер Test
const SPRINTER_TEST_ACHIEVEMENTS: Achievement[] = BOARD_SIZES.map(size => ({
  id: `score_11_timed_${size}`,
  groupId: 'sprinter_test',
  variantLabel: `${size}x${size}`,
  titleKey: 'rewards.score11Timed.title',
  descriptionKey: 'rewards.score11Timed.description',
  icon: 'stopwatch', // Було stopwatch_gold
  condition: (context: RewardConditionContext) => {
    return context.score >= 11 &&
      (context.gameMode === 'timed' || context.gameMode?.includes('timed')) &&
      context.boardSize === size;
  }
}));

// 2. Спринтер
const SPRINTER_ACHIEVEMENTS: Achievement[] = BOARD_SIZES.map(size => ({
  id: `score_111_timed_${size}`,
  groupId: 'sprinter',
  variantLabel: `${size}x${size}`,
  titleKey: 'rewards.score111Timed.title',
  descriptionKey: 'rewards.score111Timed.description',
  icon: 'stopwatch', // Було stopwatch_gold
  condition: (context: RewardConditionContext) => {
    return context.score >= 111 &&
      (context.gameMode === 'timed' || context.gameMode?.includes('timed')) &&
      context.boardSize === size;
  }
}));

// 3. Alik
const ALIK_ACHIEVEMENTS: Achievement[] = BOARD_SIZES.map(size => ({
  id: `score_532_timed_${size}`,
  groupId: 'alik',
  variantLabel: `${size}x${size}`,
  titleKey: 'rewards.score532Timed.title',
  descriptionKey: 'rewards.score532Timed.description',
  icon: 'trophy', // Було trophy_bronze
  condition: (context: RewardConditionContext) => {
    return context.score >= 532 &&
      (context.gameMode === 'timed' || context.gameMode?.includes('timed')) &&
      context.boardSize === size;
  }
}));

export const ACHIEVEMENTS: Achievement[] = [
  ...BASE_ACHIEVEMENTS,
  ...SPRINTER_TEST_ACHIEVEMENTS,
  ...SPRINTER_ACHIEVEMENTS,
  ...ALIK_ACHIEVEMENTS
];

class RewardsService {
  constructor() { }

  init() {
    rewardsStore.init();
  }

  checkAchievements(context: { score: number; gameMode: string; boardSize: number }) {
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