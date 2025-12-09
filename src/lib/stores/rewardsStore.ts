// src/lib/stores/rewardsStore.ts
/**
 * @file Store для системи нагород.
 * @description Централізоване сховище для нагород гравця.
 * Підтримує персистентність через localStorage.
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Визначення нагороди.
 */
export interface RewardDefinition {
    id: string;
    /** Ключ перекладу для назви */
    nameKey: string;
    /** Ключ перекладу для опису */
    descriptionKey: string;
    /** Тип нагороди */
    type: 'score' | 'action' | 'streak' | 'milestone';
    /** Іконка (emoji або шлях до SVG) */
    icon: string;
    /** Умова отримання */
    condition: RewardCondition;
    /** Чи прихована до отримання */
    isSecret?: boolean;
}

/**
 * Умова отримання нагороди.
 */
export interface RewardCondition {
    /** Тип умови */
    type: 'score_threshold' | 'jump_count' | 'games_played' | 'win_streak' | 'custom';
    /** Порогове значення */
    threshold?: number;
    /** Режим гри (опціонально) */
    gameMode?: string;
}

/**
 * Прогрес нагороди.
 */
export interface RewardProgress {
    rewardId: string;
    currentValue: number;
    targetValue: number;
    isUnlocked: boolean;
    unlockedAt?: number;
}

/**
 * Стан системи нагород.
 */
export interface RewardsState {
    /** Прогрес по кожній нагороді */
    progress: Record<string, RewardProgress>;
    /** Нещодавно отримані нагороди (для показу в UI) */
    recentlyUnlocked: string[];
    /** Загальна кількість отриманих нагород */
    totalUnlocked: number;
}

const STORAGE_KEY = 'stay_on_board_rewards';

/**
 * Визначення всіх доступних нагород.
 */
export const REWARD_DEFINITIONS: RewardDefinition[] = [
    {
        id: 'score_532',
        nameKey: 'rewards.expertPlayer.name',
        descriptionKey: 'rewards.expertPlayer.description',
        type: 'score',
        icon: '🏆',
        condition: { type: 'score_threshold', threshold: 532, gameMode: 'training' }
    },
    {
        id: 'jumps_10',
        nameKey: 'rewards.jumper.name',
        descriptionKey: 'rewards.jumper.description',
        type: 'action',
        icon: '🦘',
        condition: { type: 'jump_count', threshold: 10 }
    },
    {
        id: 'score_100',
        nameKey: 'rewards.centurion.name',
        descriptionKey: 'rewards.centurion.description',
        type: 'milestone',
        icon: '💯',
        condition: { type: 'score_threshold', threshold: 100 }
    },
    {
        id: 'score_250',
        nameKey: 'rewards.master.name',
        descriptionKey: 'rewards.master.description',
        type: 'milestone',
        icon: '⭐',
        condition: { type: 'score_threshold', threshold: 250 }
    },
    {
        id: 'games_10',
        nameKey: 'rewards.dedicated.name',
        descriptionKey: 'rewards.dedicated.description',
        type: 'milestone',
        icon: '🎮',
        condition: { type: 'games_played', threshold: 10 }
    },
    {
        id: 'win_streak_3',
        nameKey: 'rewards.unstoppable.name',
        descriptionKey: 'rewards.unstoppable.description',
        type: 'streak',
        icon: '🔥',
        condition: { type: 'win_streak', threshold: 3 }
    }
];

/**
 * Початковий стан.
 */
function getInitialState(): RewardsState {
    if (browser) {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('[rewardsStore] Failed to load from localStorage:', e);
        }
    }

    // Ініціалізуємо прогрес для всіх нагород
    const progress: Record<string, RewardProgress> = {};
    for (const reward of REWARD_DEFINITIONS) {
        progress[reward.id] = {
            rewardId: reward.id,
            currentValue: 0,
            targetValue: reward.condition.threshold || 1,
            isUnlocked: false
        };
    }

    return {
        progress,
        recentlyUnlocked: [],
        totalUnlocked: 0
    };
}

function createRewardsStore() {
    const { subscribe, set, update } = writable<RewardsState>(getInitialState());

    // Автозбереження в localStorage
    if (browser) {
        subscribe(state => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                console.error('[rewardsStore] Failed to save to localStorage:', e);
            }
        });
    }

    return {
        subscribe,

        /**
         * Оновлює прогрес нагороди.
         */
        updateProgress(rewardId: string, newValue: number): void {
            update(state => {
                const progress = { ...state.progress };
                const reward = progress[rewardId];

                if (!reward || reward.isUnlocked) {
                    return state;
                }

                const wasUnlocked = reward.isUnlocked;
                reward.currentValue = newValue;

                // Перевіряємо чи досягнуто цілі
                if (newValue >= reward.targetValue && !wasUnlocked) {
                    reward.isUnlocked = true;
                    reward.unlockedAt = Date.now();

                    return {
                        ...state,
                        progress,
                        recentlyUnlocked: [...state.recentlyUnlocked, rewardId],
                        totalUnlocked: state.totalUnlocked + 1
                    };
                }

                return { ...state, progress };
            });
        },

        /**
         * Розблоковує нагороду напряму.
         */
        unlockReward(rewardId: string): void {
            update(state => {
                const progress = { ...state.progress };
                const reward = progress[rewardId];

                if (!reward || reward.isUnlocked) {
                    return state;
                }

                reward.isUnlocked = true;
                reward.unlockedAt = Date.now();
                reward.currentValue = reward.targetValue;

                return {
                    ...state,
                    progress,
                    recentlyUnlocked: [...state.recentlyUnlocked, rewardId],
                    totalUnlocked: state.totalUnlocked + 1
                };
            });
        },

        /**
         * Очищує список нещодавно отриманих нагород.
         */
        clearRecentlyUnlocked(): void {
            update(state => ({ ...state, recentlyUnlocked: [] }));
        },

        /**
         * Скидає всі нагороди (для тестування).
         */
        reset(): void {
            set(getInitialState());
        }
    };
}

export const rewardsStore = createRewardsStore();

/**
 * Derived store для отримання списку розблокованих нагород.
 */
export const unlockedRewards = derived(rewardsStore, $state =>
    REWARD_DEFINITIONS.filter(r => $state.progress[r.id]?.isUnlocked)
);

/**
 * Derived store для нагород в процесі.
 */
export const inProgressRewards = derived(rewardsStore, $state =>
    REWARD_DEFINITIONS.filter(r => !$state.progress[r.id]?.isUnlocked && !r.isSecret)
);
