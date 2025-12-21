import { writable, get } from 'svelte/store';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseApp } from '../firebaseService';
import { logService } from '../logService';
import { rewardsStore } from '$lib/stores/rewardsStore';
import { appVersion } from '$lib/stores/versionStore';

export interface UserProfile {
    uid: string;
    displayName: string | null;
    bestTimeScore: number;
    isAnonymous: boolean;
}

const getInitialProfile = (): UserProfile => {
    if (typeof localStorage === 'undefined') {
        return { uid: 'local', displayName: null, bestTimeScore: 0, isAnonymous: true };
    }
    const localName = localStorage.getItem('online_playerName');
    const displayName = (localName === 'Player' || !localName) ? null : localName;

    return {
        uid: 'local',
        displayName: displayName,
        bestTimeScore: parseInt(localStorage.getItem('local_best_time_score') || '0'),
        isAnonymous: true
    };
};

export const userProfileStore = writable<UserProfile | null>(getInitialProfile());

class UserProfileService {
    private db;

    constructor() {
        const app = getFirebaseApp();
        this.db = getFirestore(app);
    }

    async syncUserProfile(user: User) {
        const userRef = doc(this.db, 'users', user.uid);

        rewardsStore.syncWithCloud(user.uid);

        try {
            const snap = await getDoc(userRef);

            const localBest = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('local_best_time_score') || '0') : 0;
            const localNameRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('online_playerName') : null;
            const localName = (localNameRaw === 'Player') ? null : localNameRaw;

            if (snap.exists()) {
                const data = snap.data();
                const cloudBest = data.bestTimeScore || 0;
                const cloudName = data.displayName || null;

                const finalBest = Math.max(localBest, cloudBest);

                const updates: any = { lastActive: Date.now() };
                if (localBest > cloudBest) updates.bestTimeScore = localBest;

                if (!cloudName && localName) updates.displayName = localName;

                await setDoc(userRef, updates, { merge: true });

                if (cloudBest > localBest && typeof localStorage !== 'undefined') {
                    localStorage.setItem('local_best_time_score', cloudBest.toString());
                }
                if (cloudName && typeof localStorage !== 'undefined') {
                    localStorage.setItem('online_playerName', cloudName);
                }

                userProfileStore.set({
                    uid: user.uid,
                    displayName: cloudName || localName,
                    bestTimeScore: finalBest,
                    isAnonymous: user.isAnonymous
                });
            } else {
                const currentVersion = get(appVersion);
                const initialData = {
                    displayName: localName,
                    bestTimeScore: localBest,
                    createdAt: Date.now(),
                    lastActive: Date.now(),
                    createdVersion: currentVersion || 'unknown'
                };
                await setDoc(userRef, initialData);

                userProfileStore.set({
                    uid: user.uid,
                    displayName: localName,
                    bestTimeScore: localBest,
                    isAnonymous: user.isAnonymous
                });
            }
        } catch (e) {
            logService.error('[UserProfileService] Sync profile failed', e);
            const localBest = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('local_best_time_score') || '0') : 0;
            const localName = typeof localStorage !== 'undefined' ? localStorage.getItem('online_playerName') : null;

            userProfileStore.set({
                uid: user.uid,
                displayName: localName === 'Player' ? null : localName,
                bestTimeScore: localBest,
                isAnonymous: user.isAnonymous
            });
        }
    }

    async updateNickname(name: string, currentUser: User | null) {
        const nameToSave = (name && name.trim() !== '' && name !== 'Player') ? name : null;

        userProfileStore.update(s => s ? { ...s, displayName: nameToSave } : null);

        if (typeof localStorage !== 'undefined') {
            if (nameToSave) {
                localStorage.setItem('online_playerName', nameToSave);
            } else {
                localStorage.removeItem('online_playerName');
            }
        }

        if (!currentUser) return;

        try {
            // Note: updateProfile is an Auth function, so we might need to pass it or handle it in authService?
            // Actually, updateProfile is from firebase/auth. It updates the Auth object.
            // But we also update Firestore here. 
            // Better design: separate Auth profile update from Firestore profile update.
            // For now, let's keep it here but we need to import updateProfile.
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(currentUser, { displayName: nameToSave });

            const userRef = doc(this.db, 'users', currentUser.uid);

            await setDoc(userRef, {
                displayName: nameToSave,
                lastActive: Date.now()
            }, { merge: true });

            logService.action(`[UserProfileService] Nickname updated to ${nameToSave}`);
        } catch (error) {
            logService.error('[UserProfileService] Update profile error', error);
        }
    }

    public clearLocalUserData() {
        if (typeof localStorage === 'undefined') return;
        logService.init('[UserProfileService] Clearing local user data...');
        localStorage.removeItem('local_best_time_score');
        localStorage.removeItem('sotb_rewards');
        localStorage.removeItem('online_playerName');
    }

    public resetLocalProfile() {
        userProfileStore.set({
            uid: 'local',
            displayName: null,
            bestTimeScore: 0,
            isAnonymous: true
        });
    }
}

export const userProfileService = new UserProfileService();
