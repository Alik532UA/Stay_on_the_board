import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    updateProfile,
    linkWithCredential,
    EmailAuthProvider,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    type User
} from 'firebase/auth';
import { getFirebaseApp } from './firebaseService';
import { writable, get } from 'svelte/store';
import { logService } from './logService';
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore';
import { notificationService } from './notificationService';

export interface UserProfile {
    uid: string;
    displayName: string;
    bestTimeScore: number;
    isAnonymous: boolean;
}

export const userStore = writable<User | null>(null);
// Ініціалізуємо з локальних даних, якщо вони є
const initialLocalScore = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('local_best_time_score') || '0') : 0;
const initialName = typeof localStorage !== 'undefined' ? localStorage.getItem('online_playerName') || 'Player' : 'Player';

export const userProfileStore = writable<UserProfile | null>({
    uid: 'local',
    displayName: initialName,
    bestTimeScore: initialLocalScore,
    isAnonymous: true
});

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
                this.signInAnonymously();
            }
        });
    }

    async signInAnonymously() {
        try {
            await signInAnonymously(this.auth);
        } catch (error) {
            logService.error('[AuthService] Anonymous sign in error', error);
            // Навіть якщо помилка, ми залишаємо локальний профіль активним
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
            await signInWithEmailAndPassword(this.auth, email, pass);
            logService.action(`[AuthService] Logged in as ${email}`);
            return true;
        } catch (error: any) {
            logService.error('[AuthService] Login error', error);
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
        // Оновлюємо локально
        userProfileStore.update(s => s ? { ...s, displayName: name } : null);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('online_playerName', name);
        }

        const user = this.auth.currentUser;
        if (!user) return;

        try {
            await updateProfile(user, { displayName: name });
            const userRef = doc(this.db, 'users', user.uid);
            await setDoc(userRef, { displayName: name }, { merge: true });

            logService.action(`[AuthService] Nickname updated to ${name}`);
        } catch (error) {
            logService.error('[AuthService] Update profile error', error);
        }
    }

    private async syncUserProfile(user: User) {
        const userRef = doc(this.db, 'users', user.uid);

        try {
            const snap = await getDoc(userRef);

            // Отримуємо локальний рекорд
            const localBest = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('local_best_time_score') || '0') : 0;
            const localName = typeof localStorage !== 'undefined' ? localStorage.getItem('online_playerName') : null;

            if (snap.exists()) {
                const data = snap.data();
                const cloudBest = data.bestTimeScore || 0;

                // Синхронізація рекордів: беремо максимальний
                const finalBest = Math.max(localBest, cloudBest);

                // Якщо локальний кращий, оновлюємо хмару
                if (localBest > cloudBest) {
                    setDoc(userRef, { bestTimeScore: localBest }, { merge: true });
                }
                // Якщо хмарний кращий, оновлюємо локалку
                if (cloudBest > localBest) {
                    localStorage.setItem('local_best_time_score', cloudBest.toString());
                }

                userProfileStore.set({
                    uid: user.uid,
                    displayName: data.displayName || user.displayName || localName || 'Anonymous',
                    bestTimeScore: finalBest,
                    isAnonymous: user.isAnonymous
                });
            } else {
                // Створюємо профіль, якщо немає, використовуючи локальні дані
                const initialData = {
                    displayName: user.displayName || localName || 'Player',
                    bestTimeScore: localBest,
                    createdAt: Date.now()
                };
                await setDoc(userRef, initialData);
                userProfileStore.set({
                    uid: user.uid,
                    displayName: initialData.displayName,
                    bestTimeScore: localBest,
                    isAnonymous: user.isAnonymous
                });
            }
        } catch (e) {
            logService.error('[AuthService] Sync profile failed', e);
            // Fallback до локальних даних при помилці мережі
            const localBest = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('local_best_time_score') || '0') : 0;
            userProfileStore.set({
                uid: user.uid,
                displayName: user.displayName || 'Player',
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

        notificationService.show({ type: 'error', messageRaw: msg });
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }
}

export const authService = new AuthService();