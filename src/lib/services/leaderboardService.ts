import {
    getFirestore,
    collection,
    query,
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
import { get } from 'svelte/store';

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    score: number;
    timestamp: number;
}

const LOCAL_BEST_SCORE_KEY = 'local_best_time_score';

class LeaderboardService {
    private db;

    constructor() {
        this.db = getFirestore(getFirebaseApp());
    }

    /**
     * Зберігає новий рекорд.
     * Спочатку зберігає локально, потім намагається відправити в хмару.
     */
    async submitScore(score: number, gameMode: string) {
        // Зберігаємо тільки для режиму "timed"
        if (gameMode !== 'timed' && gameMode !== 'virtual-player-timed') return;

        logService.score(`[Leaderboard] Processing score: ${score}`);

        // 1. ЛОКАЛЬНЕ ЗБЕРЕЖЕННЯ (Працює завжди)
        const currentLocalBest = this.getLocalBestScore();

        if (score > currentLocalBest) {
            localStorage.setItem(LOCAL_BEST_SCORE_KEY, score.toString());
            logService.score(`[Leaderboard] New Local Best Saved: ${score}`);

            // Миттєво оновлюємо UI
            userProfileStore.update(s => {
                if (s) {
                    return { ...s, bestTimeScore: score };
                } else {
                    // Якщо профілю ще немає, створюємо тимчасовий
                    return {
                        uid: 'local',
                        displayName: localStorage.getItem('online_playerName') || 'Player',
                        bestTimeScore: score,
                        isAnonymous: true
                    };
                }
            });
        }

        // 2. ХМАРНЕ ЗБЕРЕЖЕННЯ (Якщо є юзер)
        const user = authService.getCurrentUser();
        if (!user) {
            logService.error('[Leaderboard] No user logged in. Score saved locally only.');
            return;
        }

        const userRef = doc(this.db, 'users', user.uid);
        const scoreRef = doc(collection(this.db, 'scores'));

        try {
            await runTransaction(this.db, async (transaction) => {
                const userDoc = await transaction.get(userRef);

                // Якщо документа юзера немає, транзакція може впасти, тому перевіряємо
                let currentDbBest = 0;
                if (userDoc.exists()) {
                    currentDbBest = userDoc.data().bestTimeScore || 0;
                } else {
                    // Створюємо документ юзера, якщо його немає
                    transaction.set(userRef, {
                        displayName: user.displayName || 'Anonymous',
                        bestTimeScore: score,
                        createdAt: Date.now()
                    });
                }

                // Записуємо в історію ігор завжди
                transaction.set(scoreRef, {
                    uid: user.uid,
                    displayName: user.displayName || 'Anonymous',
                    score: score,
                    gameMode: 'timed',
                    timestamp: Date.now()
                });

                // Оновлюємо особистий рекорд в базі, тільки якщо він кращий
                if (score > currentDbBest) {
                    transaction.update(userRef, {
                        bestTimeScore: score,
                        lastActive: Date.now()
                    });
                    logService.score(`[Leaderboard] Cloud Personal Best Updated!`);
                }
            });
        } catch (e) {
            logService.error('[Leaderboard] Failed to submit score to cloud', e);
            // Якщо транзакція не пройшла (наприклад, документ не існує), пробуємо setDoc
            try {
                await setDoc(userRef, { bestTimeScore: score }, { merge: true });
            } catch (retryError) {
                logService.error('[Leaderboard] Retry failed', retryError);
            }
        }
    }

    getLocalBestScore(): number {
        if (typeof localStorage === 'undefined') return 0;
        return parseInt(localStorage.getItem(LOCAL_BEST_SCORE_KEY) || '0', 10);
    }

    /**
     * Отримує топ гравців.
     */
    async getTopPlayers(limitCount: number = 10): Promise<LeaderboardEntry[]> {
        try {
            const usersRef = collection(this.db, 'users');
            const q = query(
                usersRef,
                orderBy('bestTimeScore', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const leaders: LeaderboardEntry[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.bestTimeScore > 0) {
                    leaders.push({
                        uid: doc.id,
                        displayName: data.displayName || 'Anonymous',
                        score: data.bestTimeScore,
                        timestamp: data.lastActive || 0
                    });
                }
            });

            return leaders;
        } catch (e) {
            logService.error('[Leaderboard] Failed to fetch leaders', e);
            return [];
        }
    }
}

export const leaderboardService = new LeaderboardService();