import { writable, get } from 'svelte/store';
import type { RewardsState, UnlockedReward } from '$lib/types/rewards';
import { logService } from '$lib/services/logService';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from '$lib/services/firebaseService';

const STORAGE_KEY = 'sotb_rewards';

const defaultState: RewardsState = {
    unlockedRewards: {},
    hasUnseenRewards: false
};

function createRewardsStore() {
    const { subscribe, set, update } = writable<RewardsState>(defaultState);

    // Допоміжна функція для отримання DB
    const getDb = () => {
        try {
            return getFirestore(getFirebaseApp());
        } catch (e) {
            return null;
        }
    };

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
                    logService.info('[RewardsStore] Loaded state from localStorage');
                }
            } catch (e) {
                logService.error('[RewardsStore] Failed to load from localStorage', e);
            }
        },

        unlock: (rewardId: string) => {
            update(state => {
                if (state.unlockedRewards[rewardId]) return state; // Вже відкрито

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

                // 1. Зберігаємо локально
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
                }

                // 2. Зберігаємо в хмару (якщо є юзер)
                const auth = getAuth(getFirebaseApp());
                const user = auth.currentUser;
                const db = getDb();

                if (user && db) {
                    const userRef = doc(db, 'users', user.uid);
                    // Використовуємо setDoc з merge, щоб оновити тільки поле unlockedRewards
                    // Ми використовуємо dot notation для оновлення конкретного ключа в мапі
                    const updateData = {
                        [`unlockedRewards.${rewardId}`]: newReward
                    };
                    updateDoc(userRef, updateData).catch(err => {
                        // Якщо документа немає, створюємо його (рідкісний кейс, але можливий)
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

        /**
         * Синхронізує локальні нагороди з хмарними.
         * Викликається при вході користувача.
         */
        syncWithCloud: async (uid: string) => {
            const db = getDb();
            if (!db) return;

            const userRef = doc(db, 'users', uid);

            try {
                const snap = await getDoc(userRef);
                const localState = get(rewardsStore);
                let remoteRewards: Record<string, UnlockedReward> = {};

                if (snap.exists()) {
                    remoteRewards = snap.data().unlockedRewards || {};
                }

                // Злиття: об'єднуємо локальні та віддалені
                // Якщо нагорода є і там і там, беремо ту, що отримана раніше
                const mergedRewards = { ...localState.unlockedRewards };
                let hasChangesToUpload = false;

                // 1. Додаємо хмарні до локальних
                for (const [id, reward] of Object.entries(remoteRewards)) {
                    if (!mergedRewards[id]) {
                        mergedRewards[id] = reward;
                    } else {
                        // Конфлікт: залишаємо найстарішу дату
                        if (reward.unlockedAt < mergedRewards[id].unlockedAt) {
                            mergedRewards[id] = reward;
                        }
                    }
                }

                // 2. Перевіряємо, чи є локальні, яких немає в хмарі (щоб залити їх)
                for (const id of Object.keys(mergedRewards)) {
                    if (!remoteRewards[id]) {
                        hasChangesToUpload = true;
                    }
                }

                // Оновлюємо стор
                const newState = {
                    ...localState,
                    unlockedRewards: mergedRewards
                };
                set(newState);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

                // Якщо були нові локальні нагороди, відправляємо повний список в хмару
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
            set(defaultState);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    };
}

export const rewardsStore = createRewardsStore();