import { getFirestoreDb } from './firebaseService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { get } from 'svelte/store';
import { appVersion } from '$lib/stores/versionStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { playerStore } from '$lib/stores/playerStore';
import { logService } from './logService';
import { notificationService } from './notificationService';

// Додано 'reward_suggestion'
export type FeedbackType = 'improvement' | 'bug' | 'other' | 'reward_suggestion';

export interface FeedbackData {
    type: FeedbackType;
    page?: string;
    text?: string; // Для "improvement", "other" та "reward_suggestion"
    actualResult?: string; // Для "bug"
    expectedResult?: string; // Для "bug"
}

class FeedbackService {
    /**
     * Збирає технічний контекст та відправляє відгук у Firestore.
     * Використовує структуру підколекцій для організації за типом.
     */
    async submitFeedback(data: FeedbackData): Promise<void> {
        logService.action('[FeedbackService] Submitting feedback...', data);

        try {
            const db = getFirestoreDb();

            // Генеруємо читабельний ID: YYYY-MM-DD_HH-mm-ss_SSS_RAND
            const docId = this.generateTimestampId();

            // Створюємо шлях: feedback (колекція) -> {type} (документ) -> entries (підколекція) -> {docId} (документ)
            const feedbackDocRef = doc(db, 'feedback', data.type, 'entries', docId);

            // Збір контексту
            const context = this.gatherContext();

            const payload = {
                ...data,
                context,
                createdAt: serverTimestamp(),
                status: 'new',
                id: docId
            };

            await setDoc(feedbackDocRef, payload);

            logService.action(`[FeedbackService] Feedback submitted successfully to ${data.type}/${docId}`);
            notificationService.show({
                type: 'success',
                messageKey: 'ui.feedback.success',
                duration: 4000
            });

        } catch (error) {
            logService.error('[FeedbackService] Failed to submit feedback', error);
            notificationService.show({
                type: 'error',
                messageKey: 'ui.feedback.error',
                duration: 5000
            });
            throw error;
        }
    }

    private generateTimestampId(): string {
        const now = new Date();
        const pad = (num: number) => num.toString().padStart(2, '0');
        const padMs = (num: number) => num.toString().padStart(3, '0');

        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());
        const ms = padMs(now.getMilliseconds());

        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}_${ms}_${randomSuffix}`;
    }

    private gatherContext() {
        const settings = get(gameSettingsStore);
        const playerState = get(playerStore);

        let playerId = 'anonymous';
        if (playerState && playerState.players.length > 0) {
            playerId = playerState.players[0].id.toString();
        } else if (typeof localStorage !== 'undefined') {
            playerId = localStorage.getItem('online_playerName') || 'anonymous';
        }

        return {
            appVersion: get(appVersion) || 'unknown',
            gameMode: settings.gameMode,
            screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            timestamp: Date.now(),
            playerId
        };
    }
}

export const feedbackService = new FeedbackService();