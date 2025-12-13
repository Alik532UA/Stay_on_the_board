import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    updateProfile,
    linkWithCredential,
    EmailAuthProvider,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    reauthenticateWithCredential,
    deleteUser,
    type User
} from 'firebase/auth';
import { getFirebaseApp } from './firebaseService';
import { writable, get } from 'svelte/store';
import { logService } from './logService';
import { doc, setDoc, getFirestore, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { notificationService } from './notificationService';
import { rewardsStore } from '$lib/stores/rewardsStore';

export interface UserProfile {
    uid: string;
    displayName: string | null; // Може бути null
    bestTimeScore: number;
    isAnonymous: boolean;
}

export const userStore = writable<User | null>(null);

const getInitialProfile = (): UserProfile => {
    if (typeof localStorage === 'undefined') {
        return { uid: 'local', displayName: null, bestTimeScore: 0, isAnonymous: true };
    }
    // Якщо в localStorage "Player", вважаємо це як null (дефолт)
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

class AuthService {
    private auth;
    private db;

    constructor() {
        const app = getFirebaseApp();
        this.auth = getAuth(app);
        this.db = getFirestore(app);

        onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                logService.init(`[AuthService] User logged in: ${user.uid} (Anon: ${user.isAnonymous})`);
                userStore.set(user);
                await this.syncUserProfile(user);
            } else {
                logService.init('[AuthService] No user logged in. Signing in anonymously...');
                userStore.set(null);
                this.signInAnonymously();
            }
        });
    }

    async signInAnonymously() {
        try {
            await signInAnonymously(this.auth);
        } catch (error) {
            logService.error('[AuthService] Anonymous sign in error', error);
        }
    }

    async linkEmailPassword(email: string, pass: string): Promise<boolean> {
        const user = this.auth.currentUser;
        if (!user) return false;

        try {
            const credential = EmailAuthProvider.credential(email, pass);
            const result = await linkWithCredential(user, credential);

            logService.action(`[AuthService] Account linked successfully: ${result.user.email}`);
            await this.syncUserProfile(result.user);

            notificationService.show({
                type: 'success',
                messageRaw: 'Акаунт успішно збережено! Тепер ви можете увійти з будь-якого пристрою.'
            });
            return true;
        } catch (error: any) {
            logService.error('[AuthService] Link account error', error);
            this.handleAuthError(error);
            return false;
        }
    }

    async loginEmailPassword(email: string, pass: string) {
        try {
            this.clearLocalUserData();
            await signInWithEmailAndPassword(this.auth, email, pass);
            logService.action(`[AuthService] Logged in as ${email}`);
            return true;
        } catch (error: any) {
            logService.error('[AuthService] Login error', error);
            this.handleAuthError(error);
            return false;
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            logService.action('[AuthService] Logged out');

            this.clearLocalUserData();

            userProfileStore.set({
                uid: 'local',
                displayName: null,
                bestTimeScore: 0,
                isAnonymous: true
            });
            rewardsStore.reset();

            notificationService.show({ type: 'info', messageRaw: 'Ви вийшли з акаунту.' });
            return true;
        } catch (error) {
            logService.error('[AuthService] Logout error', error);
            return false;
        }
    }

    private clearLocalUserData() {
        if (typeof localStorage === 'undefined') return;
        logService.init('[AuthService] Clearing local user data...');
        localStorage.removeItem('local_best_time_score');
        localStorage.removeItem('sotb_rewards');
        localStorage.removeItem('online_playerName');
    }

    async deleteAccount(password: string): Promise<boolean> {
        const user = this.auth.currentUser;
        if (!user || !user.email) return false;

        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            const userRef = doc(this.db, 'users', user.uid);
            await deleteDoc(userRef);
            logService.action(`[AuthService] User data deleted from Firestore: ${user.uid}`);

            await deleteUser(user);
            logService.action('[AuthService] User deleted from Auth');

            this.clearLocalUserData();

            notificationService.show({ type: 'success', messageRaw: 'Акаунт успішно видалено.' });
            return true;
        } catch (error: any) {
            logService.error('[AuthService] Delete account error', error);
            this.handleAuthError(error);
            return false;
        }
    }

    async resetPassword(email: string) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            logService.action(`[AuthService] Password reset email sent to ${email}`);
            notificationService.show({
                type: 'info',
                messageRaw: 'Лист для відновлення паролю відправлено. Перевірте пошту.'
            });
            return true;
        } catch (error: any) {
            logService.error('[AuthService] Reset password error', error);
            this.handleAuthError(error);
            return false;
        }
    }

    async updateNickname(name: string) {
        // Якщо ім'я пусте або "Player", зберігаємо як null
        const nameToSave = (name && name.trim() !== '' && name !== 'Player') ? name : null;

        userProfileStore.update(s => s ? { ...s, displayName: nameToSave } : null);

        if (typeof localStorage !== 'undefined') {
            if (nameToSave) {
                localStorage.setItem('online_playerName', nameToSave);
            } else {
                localStorage.removeItem('online_playerName');
            }
        }

        const user = this.auth.currentUser;
        if (!user) return;

        try {
            await updateProfile(user, { displayName: nameToSave });
            const userRef = doc(this.db, 'users', user.uid);

            // Оновлюємо ім'я та час активності
            await setDoc(userRef, {
                displayName: nameToSave,
                lastActive: Date.now()
            }, { merge: true });

            logService.action(`[AuthService] Nickname updated to ${nameToSave}`);
        } catch (error) {
            logService.error('[AuthService] Update profile error', error);
        }
    }

    private async syncUserProfile(user: User) {
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

                // Оновлюємо базу: кращий рекорд + lastActive
                const updates: any = { lastActive: Date.now() };
                if (localBest > cloudBest) updates.bestTimeScore = localBest;

                // Якщо в базі немає імені, а локально є - записуємо локальне
                if (!cloudName && localName) updates.displayName = localName;

                await setDoc(userRef, updates, { merge: true });

                // Оновлюємо локалку
                if (cloudBest > localBest && typeof localStorage !== 'undefined') {
                    localStorage.setItem('local_best_time_score', cloudBest.toString());
                }
                if (cloudName && typeof localStorage !== 'undefined') {
                    localStorage.setItem('online_playerName', cloudName);
                }

                userProfileStore.set({
                    uid: user.uid,
                    displayName: cloudName || localName, // null якщо ніде немає
                    bestTimeScore: finalBest,
                    isAnonymous: user.isAnonymous
                });
            } else {
                // Новий користувач в базі
                const initialData = {
                    displayName: localName, // null або ім'я
                    bestTimeScore: localBest,
                    createdAt: Date.now(),
                    lastActive: Date.now()
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
            logService.error('[AuthService] Sync profile failed', e);
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

    private handleAuthError(error: any) {
        let msg = 'Сталася помилка авторизації.';
        if (error.code === 'auth/email-already-in-use') msg = 'Ця пошта вже використовується іншим акаунтом.';
        if (error.code === 'auth/weak-password') msg = 'Пароль занадто слабкий (мінімум 6 символів).';
        if (error.code === 'auth/invalid-email') msg = 'Некоректний формат пошти.';
        if (error.code === 'auth/user-not-found') msg = 'Користувача з такою поштою не знайдено.';
        if (error.code === 'auth/wrong-password') msg = 'Невірний пароль.';
        if (error.code === 'auth/credential-already-in-use') msg = 'Ця пошта вже прив\'язана до іншого акаунту.';
        if (error.code === 'auth/requires-recent-login') msg = 'Для цієї дії потрібно увійти заново.';

        notificationService.show({ type: 'error', messageRaw: msg });
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }
}

export const authService = new AuthService();