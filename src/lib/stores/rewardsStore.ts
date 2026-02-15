// src/lib/stores/rewardsStore.ts
// Bridge pattern: writable-обгортка для Svelte 4.
// SSoT — rewardsState.svelte.ts (Runes).

import { writable, get } from 'svelte/store';
import type { RewardsState, UnlockedReward } from '$lib/types/rewards';
import { logService } from '$lib/services/logService';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from '$lib/services/firebaseService';
import { rewardsState } from './rewardsState.svelte';

const STORAGE_KEY = 'sotb_rewards';

function createRewardsStore() {
    const { subscribe, set: svelteSet } = writable<RewardsState>(rewardsState.state);

    const syncStore = () => { svelteSet(rewardsState.state); };

    const getDb = () => {
        try {
            return getFirestore(getFirebaseApp());
        } catch (e) {
            return null;
        }
    };

    const store = {
        subscribe,

        init: () => {
            if (typeof window === 'undefined') return;

            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    rewardsState.state = {
                        unlockedRewards: parsed.unlockedRewards || {},
                        hasUnseenRewards: parsed.hasUnseenRewards || false
                    };
                    syncStore();
                    logService.info('[RewardsStore] Loaded state from localStorage');
                }
            } catch (e) {
                logService.error('[RewardsStore] Failed to load from localStorage', e);
            }
        },

        unlock: (rewardId: string) => {
            rewardsState.update(state => {
                if (state.unlockedRewards[rewardId]) return state;

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

                // Зберігаємо локально
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
                }

                // Зберігаємо в хмару
                const auth = getAuth(getFirebaseApp());
                const user = auth.currentUser;
                const db = getDb();

                if (user && db) {
                    const userRef = doc(db, 'users', user.uid);
                    const updateData = {
                        [`unlockedRewards.${rewardId}`]: newReward
                    };
                    updateDoc(userRef, updateData).catch(err => {
                        if (err.code === 'not-found') {
                            setDoc(userRef, { unlockedRewards: { [rewardId]: newReward } }, { merge: true });
                        } else {
                            logService.error('[RewardsStore] Cloud save failed', err);
                        }
                    });
                }

                logService.info(`[RewardsStore] Unlocked reward: ${rewardId}`);
                return newState;
            });
            syncStore();
        },

        markAllAsSeen: () => {
            rewardsState.update(state => {
                const newState = { ...state, hasUnseenRewards: false };
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
                }
                return newState;
            });
            syncStore();
        },

        syncWithCloud: async (uid: string) => {
            const db = getDb();
            if (!db) return;

            const userRef = doc(db, 'users', uid);

            try {
                const snap = await getDoc(userRef);
                const localState = rewardsState.state;
                let remoteRewards: Record<string, UnlockedReward> = {};

                if (snap.exists()) {
                    remoteRewards = snap.data().unlockedRewards || {};
                }

                const mergedRewards = { ...localState.unlockedRewards };
                let hasChangesToUpload = false;

                for (const [id, reward] of Object.entries(remoteRewards)) {
                    if (!mergedRewards[id]) {
                        mergedRewards[id] = reward;
                    } else {
                        if (reward.unlockedAt < mergedRewards[id].unlockedAt) {
                            mergedRewards[id] = reward;
                        }
                    }
                }

                for (const id of Object.keys(mergedRewards)) {
                    if (!remoteRewards[id]) {
                        hasChangesToUpload = true;
                    }
                }

                const newState = {
                    ...localState,
                    unlockedRewards: mergedRewards
                };
                rewardsState.state = newState;
                syncStore();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

                if (hasChangesToUpload) {
                    await setDoc(userRef, { unlockedRewards: mergedRewards }, { merge: true });
                    logService.action('[RewardsStore] Synced local rewards to cloud.');
                } else {
                    logService.action('[RewardsStore] Synced cloud rewards to local.');
                }

            } catch (e) {
                logService.error('[RewardsStore] Sync failed', e);
            }
        },

        reset: () => {
            rewardsState.reset();
            syncStore();
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    };

    return store;
}

export const rewardsStore = createRewardsStore();