import { getFirestoreDb } from './firebaseService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { get } from 'svelte/store';
import { appVersion } from '$lib/stores/versionStore';
import { gameSettingsStore } from '$lib/stores/gameSettingsStore';
import { playerStore } from '$lib/stores/playerStore';
import { logService } from './logService';
import { notificationService } from './notificationService';

export type FeedbackType = 'improvement' | 'bug' | 'other';

export interface FeedbackData {
    type: FeedbackType;
    page?: string;
    text?: string; // Для "improvement" та "other"
    actualResult?: string; // Для "bug"
    expectedResult?: string; // Для "bug"
}

class FeedbackService {
    /**
     * Збирає технічний контекст та відправляє відгук у Firestore.
     */
    async submitFeedback(data: FeedbackData): Promise<void> {
        logService.action('[FeedbackService] Submitting feedback...', data);

        try {
            const db = getFirestoreDb();
            const feedbackRef = collection(db, 'feedback');

            // Збір контексту (Варіант 3A)
            const context = this.gatherContext();

            const payload = {
                ...data,
                context,
                createdAt: serverTimestamp(),
                status: 'new'
            };

            await addDoc(feedbackRef, payload);

            logService.action('[FeedbackService] Feedback submitted successfully.');
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

    private gatherContext() {
        const settings = get(gameSettingsStore);
        const playerState = get(playerStore);

        // Визначаємо ID гравця, якщо він є (для локальної або онлайн гри)
        let playerId = 'anonymous';
        if (playerState && playerState.players.length > 0) {
            // Беремо ID першого гравця або поточного
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