// src/lib/types/rewards.ts

/**
 * Контекст для перевірки умов розблокування досягнень
 */
export interface RewardConditionContext {
    score: number;
    gameMode: string;
    boardSize: number; // Додано обов'язкове поле
}

export interface Achievement {
    id: string;
    titleKey: string;
    descriptionKey: string;
    icon: string; // Icon name for SvgIcons
    condition: (context: RewardConditionContext) => boolean;
    isHidden?: boolean; // If true, details are hidden until unlocked

    // Нові поля для групування
    groupId?: string; // Наприклад 'sprinter'
    variantLabel?: string; // Наприклад '4x4'
}

export interface UnlockedReward {
    id: string;
    unlockedAt: number; // Timestamp
}

export interface RewardsState {
    unlockedRewards: Record<string, UnlockedReward>;
    hasUnseenRewards: boolean; // For notification indicators in menu
}