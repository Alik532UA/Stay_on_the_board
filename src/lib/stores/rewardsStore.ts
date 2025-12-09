// src/lib/stores/rewardsStore.ts
import { writable } from 'svelte/store';
import type { RewardsState, UnlockedReward } from '$lib/types/rewards';
import { logService } from '$lib/services/logService';

const STORAGE_KEY = 'sotb_rewards';

const defaultState: RewardsState = {
    unlockedRewards: {},
    hasUnseenRewards: false
};

function createRewardsStore() {
    const { subscribe, set, update } = writable<RewardsState>(defaultState);

    return {
        subscribe,

        init: () => {
            if (typeof window === 'undefined') return;

            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    set({
                        unlockedRewards: parsed.unlockedRewards || {},
                        hasUnseenRewards: parsed.hasUnseenRewards || false
                    });
                    logService.info('[RewardsStore] Loaded state from localStorage', parsed);
                }
            } catch (e) {
                logService.error('[RewardsStore] Failed to load from localStorage', e);
            }
        },

        unlock: (rewardId: string) => {
            update(state => {
                if (state.unlockedRewards[rewardId]) return state; // Already unlocked

                const newReward: UnlockedReward = {
                    id: rewardId,
                    unlockedAt: Date.now()
                };

                const newState = {
                    ...state,
                    unlockedRewards: {
                        ...state.unlockedRewards,
                        [rewardId]: newReward
                    },
                    hasUnseenRewards: true
                };

                // Persist
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
                }

                logService.info(`[RewardsStore] Unlocked reward: ${rewardId}`);
                return newState;
            });
        },

        markAllAsSeen: () => {
            update(state => {
                const newState = { ...state, hasUnseenRewards: false };
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
                }
                return newState;
            });
        },

        // Method to merge Cloud state with Local state (Future Sync)
        mergeState: (remoteState: Partial<RewardsState>) => {
            update(localState => {
                const mergedRewards = { ...localState.unlockedRewards };

                if (remoteState.unlockedRewards) {
                    Object.values(remoteState.unlockedRewards).forEach(remoteReward => {
                        if (!mergedRewards[remoteReward.id]) {
                            mergedRewards[remoteReward.id] = remoteReward;
                        } else {
                            // If both exist, keep the earliest one (technicality)
                            if (remoteReward.unlockedAt < mergedRewards[remoteReward.id].unlockedAt) {
                                mergedRewards[remoteReward.id] = remoteReward;
                            }
                        }
                    });
                }

                const newState = {
                    ...localState,
                    unlockedRewards: mergedRewards,
                    // If we pulled new rewards from cloud, we might want to flag them as unseen?
                    // For now, let's leave hasUnseenRewards as is or logically OR it.
                    hasUnseenRewards: localState.hasUnseenRewards || (remoteState.hasUnseenRewards || false)
                };

                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
                }

                logService.info('[RewardsStore] Merged remote state', newState);
                return newState;
            });
        },

        // For debugging/clearing
        reset: () => {
            set(defaultState);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    };
}

export const rewardsStore = createRewardsStore();
