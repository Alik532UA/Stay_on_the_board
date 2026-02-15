import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    linkWithCredential,
    EmailAuthProvider,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    reauthenticateWithCredential,
    deleteUser,
    updatePassword,
    type User
} from 'firebase/auth';
import { getFirebaseApp } from './firebaseService';
import { writable } from 'svelte/store';
import { logService } from './logService';
import { doc, getFirestore, deleteDoc } from 'firebase/firestore';
import { notificationService } from './notificationService';
import { rewardsStore } from '$lib/stores/rewardsStore';
import { userProfileService } from './auth/userProfileService';
import { errorHandlerService } from './errorHandlerService';

// Re-export needed types or stores if we want to keep backward compatibility strictly,
// BUT for this refactor we will update consumers to import from userProfileService directly.
export const userStore = writable<User | null>(null);

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
                await userProfileService.syncUserProfile(user);
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
            errorHandlerService.handle(error, { context: 'AuthService:SignInAnonymously' });
        }
    }

    async linkEmailPassword(email: string, pass: string): Promise<boolean> {
        const user = this.auth.currentUser;
        if (!user) return false;

        try {
            const credential = EmailAuthProvider.credential(email, pass);
            const result = await linkWithCredential(user, credential);

            logService.action(`[AuthService] Account linked successfully: ${result.user.email}`);

            // FIX: Примусово оновлюємо userStore, щоб UI миттєво відреагував на зміну isAnonymous
            userStore.set(result.user);

            await userProfileService.syncUserProfile(result.user);

            notificationService.show({
                type: 'success',
                messageRaw: 'Акаунт успішно збережено! Тепер ви можете увійти з будь-якого пристрою.'
            });
            return true;
        } catch (error: any) {
            this.handleAuthError(error, 'AuthService:LinkAccount');
            return false;
        }
    }

    async loginEmailPassword(email: string, pass: string) {
        try {
            userProfileService.clearLocalUserData();
            await signInWithEmailAndPassword(this.auth, email, pass);
            logService.action(`[AuthService] Logged in as ${email}`);
            return true;
        } catch (error: any) {
            this.handleAuthError(error, 'AuthService:Login');
            return false;
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            logService.action('[AuthService] Logged out');

            userProfileService.clearLocalUserData();
            userProfileService.resetLocalProfile();
            rewardsStore.reset();

            notificationService.show({ type: 'info', messageRaw: 'Ви вийшли з акаунту.' });
            return true;
        } catch (error) {
            errorHandlerService.handle(error, { context: 'AuthService:Logout' });
            return false;
        }
    }

    async changePassword(newPassword: string): Promise<boolean> {
        const user = this.auth.currentUser;
        if (!user) return false;

        try {
            await updatePassword(user, newPassword);
            logService.action('[AuthService] Password updated successfully');
            notificationService.show({
                type: 'success',
                messageRaw: 'Пароль успішно змінено.'
            });
            return true;
        } catch (error: any) {
            this.handleAuthError(error, 'AuthService:ChangePassword');
            return false;
        }
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

            userProfileService.clearLocalUserData();

            notificationService.show({ type: 'success', messageRaw: 'Акаунт успішно видалено.' });
            return true;
        } catch (error: any) {
            this.handleAuthError(error, 'AuthService:DeleteAccount');
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
            this.handleAuthError(error, 'AuthService:ResetPassword');
            return false;
        }
    }

    // Proxy method if needed, or consumers should use userProfileService directly
    async updateNickname(name: string) {
        const user = this.auth.currentUser;
        await userProfileService.updateNickname(name, user);
    }

    private handleAuthError(error: any, context: string) {
        let msg = 'Сталася помилка авторизації.';
        if (error.code === 'auth/email-already-in-use') msg = 'Ця пошта вже використовується іншим акаунтом.';
        if (error.code === 'auth/weak-password') msg = 'Пароль занадто слабкий (мінімум 6 символів).';
        if (error.code === 'auth/invalid-email') msg = 'Некоректний формат пошти.';
        if (error.code === 'auth/user-not-found') msg = 'Користувача з такою поштою не знайдено.';
        if (error.code === 'auth/wrong-password') msg = 'Невірний пароль.';
        if (error.code === 'auth/credential-already-in-use') msg = 'Ця пошта вже прив\'язана до іншого акаунту.';
        if (error.code === 'auth/requires-recent-login') msg = 'Для цієї дії потрібно увійти заново.';

        errorHandlerService.handle(error, { 
            context, 
            userMessageRaw: msg
        });
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }
}

export const authService = new AuthService();