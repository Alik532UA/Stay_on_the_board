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
import type { ScoreDocument, UserDocument } from '$lib/types/firebaseSchema';

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    score: number;
    timestamp: number;
    rank?: number;
    boardSize?: string; // Додано для відображення в таблиці
}

const LOCAL_BEST_PREFIX = 'local_best_';

class LeaderboardService {
    private db;

    constructor() {
        this.db = getFirestore(getFirebaseApp());
    }

    private getLeaderboardKey(mode: string, size: number, variant: string = 'default'): string {
        return `${mode}_${size}`;
    }

    async submitScore(
        score: number,
        context: { mode: string; size: number; variant?: string }
    ) {
        const { mode, size, variant = 'default' } = context;
        const leaderboardKey = this.getLeaderboardKey(mode, size, variant);

        logService.score(`[Leaderboard] Processing score: ${score} for key: ${leaderboardKey}`);

        // 1. ЛОКАЛЬНЕ ЗБЕРЕЖЕННЯ
        const localKey = `${LOCAL_BEST_PREFIX}${leaderboardKey}`;
        const currentLocalBest = this.getLocalBestScore(leaderboardKey);

        if (score > currentLocalBest) {
            localStorage.setItem(localKey, score.toString());
            logService.score(`[Leaderboard] New Local Best Saved: ${score}`);

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
                    currentDbBest = userData.stats?.[leaderboardKey] || 0;
                } else {
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

                if (score > currentDbBest) {
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
     * Отримує топ гравців.
     * Якщо size === 'all', робить запити для всіх розмірів і об'єднує результати.
     */
    async getTopPlayers(
        mode: string,
        size: number | 'all',
        limitCount: number = 10
    ): Promise<LeaderboardEntry[]> {

        if (size === 'all') {
            return this.getAggregatedTopPlayers(mode, limitCount);
        }

        const leaderboardKey = this.getLeaderboardKey(mode, size);
        return this.fetchLeaderboard(leaderboardKey, limitCount, `${size}x${size}`);
    }

    private async fetchLeaderboard(key: string, limitCount: number, sizeLabel: string): Promise<LeaderboardEntry[]> {
        try {
            const usersRef = collection(this.db, 'users');
            const q = query(
                usersRef,
                orderBy(`stats.${key}`, 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const leaders: LeaderboardEntry[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as UserDocument;
                const score = data.stats?.[key];

                if (score && score > 0) {
                    leaders.push({
                        uid: doc.id,
                        displayName: data.displayName || 'Player',
                        score: score,
                        timestamp: typeof data.lastActive === 'number' ? data.lastActive : 0,
                        boardSize: sizeLabel
                    });
                }
            });

            return leaders;
        } catch (e) {
            logService.error(`[Leaderboard] Failed to fetch leaders for ${key}`, e);
            return [];
        }
    }

    private async getAggregatedTopPlayers(mode: string, limitCount: number): Promise<LeaderboardEntry[]> {
        // Розміри дошок, які ми підтримуємо
        const sizes = [2, 3, 4, 5, 6, 7, 8, 9];

        // Запускаємо запити паралельно
        const promises = sizes.map(size =>
            this.fetchLeaderboard(this.getLeaderboardKey(mode, size), limitCount, `${size}x${size}`)
        );

        const results = await Promise.all(promises);

        // Об'єднуємо всі результати в один масив
        const allLeaders = results.flat();

        // Сортуємо за очками (DESC)
        allLeaders.sort((a, b) => b.score - a.score);

        // Беремо топ N
        return allLeaders.slice(0, limitCount);
    }
}

const LOCAL_BEST_SCORE_KEY_PREFIX = 'local_best_';

export const leaderboardService = new LeaderboardService();