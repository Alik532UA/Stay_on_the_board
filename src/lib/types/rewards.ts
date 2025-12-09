// src/lib/types/rewards.ts

export interface Achievement {
    id: string;
    titleKey: string;
    descriptionKey: string;
    icon: string; // Icon name for SvgIcons
    condition: (context: any) => boolean; // Flexible context for future checks
    isHidden?: boolean; // If true, details are hidden until unlocked
}

export interface UnlockedReward {
    id: string;
    unlockedAt: number; // Timestamp
}

export interface RewardsState {
    unlockedRewards: Record<string, UnlockedReward>;
    hasUnseenRewards: boolean; // For notification indicators in menu
}
