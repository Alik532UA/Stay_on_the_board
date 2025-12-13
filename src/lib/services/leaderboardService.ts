import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    runTransaction,
    setDoc
} from 'firebase/firestore';
import { getFirebaseApp } from './firebaseService';
import { authService, userProfileStore } from './authService';
import { logService } from './logService';
import type { ScoreDocument, UserDocument } from '$lib/types/firebaseSchema';

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    score: number;
    timestamp: number;
    rank?: number;
}

const LOCAL_BEST_PREFIX = 'local_best_';

class LeaderboardService {
    private db;

    constructor() {
        this.db = getFirestore(getFirebaseApp());
    }

    /**
     * Генерує унікальний ключ для лідерборду.
     * Приклад: 'timed_4' (режим timed, дошка 4x4)
     */
    private getLeaderboardKey(mode: string, size: number, variant: string = 'default'): string {
        return `${mode}_${size}`; // Можна додати variant, якщо потрібно: `${mode}_${variant}_${size}`
    }

    /**
     * Зберігає результат гри.
     * Автоматично визначає, чи це новий рекорд.
     */
    async submitScore(
        score: number,
        context: { mode: string; size: number; variant?: string }
    ) {
        const { mode, size, variant = 'default' } = context;
        const leaderboardKey = this.getLeaderboardKey(mode, size, variant);

        logService.score(`[Leaderboard] Processing score: ${score} for key: ${leaderboardKey}`);

        // 1. ЛОКАЛЬНЕ ЗБЕРЕЖЕННЯ (Offline-first)
        const localKey = `${LOCAL_BEST_PREFIX}${leaderboardKey}`;
        const currentLocalBest = this.getLocalBestScore(leaderboardKey);

        if (score > currentLocalBest) {
            localStorage.setItem(localKey, score.toString());
            logService.score(`[Leaderboard] New Local Best Saved: ${score}`);

            // Оновлюємо UI (userProfileStore)
            // Примітка: userProfileStore зараз заточений під bestTimeScore, 
            // для масштабування треба буде оновити і його структуру, 
            // але поки що оновлюємо тільки якщо це timed режим.
            if (mode === 'timed') {
                userProfileStore.update(s => s ? { ...s, bestTimeScore: score } : null);
            }
        }

        // 2. ХМАРНЕ ЗБЕРЕЖЕННЯ
        const user = authService.getCurrentUser();
        if (!user) return;

        const userRef = doc(this.db, 'users', user.uid);
        const scoreRef = doc(collection(this.db, 'scores'));

        try {
            await runTransaction(this.db, async (transaction) => {
                const userDocSnap = await transaction.get(userRef);
                let currentDbBest = 0;

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data() as UserDocument;
                    // Безпечний доступ до вкладеного об'єкта stats
                    currentDbBest = userData.stats?.[leaderboardKey] || 0;
                } else {
                    // Ініціалізація користувача, якщо не існує
                    const newUser: Partial<UserDocument> = {
                        displayName: user.displayName || null,
                        isAnonymous: user.isAnonymous,
                        createdAt: Date.now(),
                        lastActive: Date.now(),
                        stats: {},
                        unlockedRewards: {}
                    };
                    transaction.set(userRef, newUser);
                }

                // Запис в історію (scores collection)
                const scoreData: ScoreDocument = {
                    uid: user.uid,
                    displayName: user.displayName || null,
                    gameMode: mode,
                    boardSize: size,
                    variant,
                    score,
                    timestamp: Date.now(),
                    leaderboardKey
                };
                transaction.set(scoreRef, scoreData);

                // Оновлення рекорду в профілі (users collection)
                if (score > currentDbBest) {
                    // Використовуємо dot notation для оновлення конкретного поля в мапі
                    transaction.update(userRef, {
                        [`stats.${leaderboardKey}`]: score,
                        lastActive: Date.now()
                    });
                    logService.score(`[Leaderboard] Cloud Personal Best Updated for ${leaderboardKey}!`);
                } else {
                    transaction.update(userRef, { lastActive: Date.now() });
                }
            });
        } catch (e) {
            logService.error('[Leaderboard] Failed to submit score to cloud', e);
            // Fallback (спроба записати хоча б через setDoc merge)
            try {
                await setDoc(userRef, {
                    stats: { [leaderboardKey]: score },
                    lastActive: Date.now()
                }, { merge: true });
            } catch (retryError) {
                logService.error('[Leaderboard] Retry failed', retryError);
            }
        }
    }

    getLocalBestScore(leaderboardKey: string): number {
        if (typeof localStorage === 'undefined') return 0;
        return parseInt(localStorage.getItem(`${LOCAL_BEST_SCORE_KEY_PREFIX}${leaderboardKey}`) || '0', 10);
    }

    /**
     * Отримує топ гравців для конкретного режиму та розміру дошки.
     */
    async getTopPlayers(
        mode: string,
        size: number,
        limitCount: number = 10
    ): Promise<LeaderboardEntry[]> {
        const leaderboardKey = this.getLeaderboardKey(mode, size);

        try {
            // Ми шукаємо в колекції users, сортуючи по вкладеному полю stats.{key}
            const usersRef = collection(this.db, 'users');
            const q = query(
                usersRef,
                orderBy(`stats.${leaderboardKey}`, 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const leaders: LeaderboardEntry[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as UserDocument;
                const score = data.stats?.[leaderboardKey];

                if (score && score > 0) {
                    leaders.push({
                        uid: doc.id,
                        displayName: data.displayName || 'Player',
                        score: score,
                        timestamp: typeof data.lastActive === 'number' ? data.lastActive : 0
                    });
                }
            });

            return leaders;
        } catch (e) {
            logService.error(`[Leaderboard] Failed to fetch leaders for ${leaderboardKey}`, e);
            return [];
        }
    }
}

// Для зворотної сумісності зі старим кодом
const LOCAL_BEST_SCORE_KEY_PREFIX = 'local_best_';

export const leaderboardService = new LeaderboardService();