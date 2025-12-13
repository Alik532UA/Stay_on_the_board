import type { Timestamp } from 'firebase/firestore';

/**
 * @file Визначення схеми Firestore.
 * @description Цей файл описує структуру документів у базі даних.
 * Використовуйте ці типи при запису та читанні даних.
 */

// === КОЛЕКЦІЯ: users ===
export interface UserDocument {
    displayName: string | null;
    isAnonymous: boolean;
    createdAt: number | Timestamp;
    lastActive: number | Timestamp;

    // Версія додатку, на якій був створений акаунт
    createdVersion?: string;

    // Агреговані дані (для швидкого доступу без зайвих запитів)
    stats: UserStats;

    // Розблоковані нагороди (Map: rewardId -> data)
    unlockedRewards: Record<string, {
        id: string;
        unlockedAt: number;
    }>;
}

// Статистика гравця (розширювана)
export interface UserStats {
    // Ключ формату: {mode}_{variant}_{boardSize}
    // Наприклад: 'timed_classic_4x4', 'survival_default_8x8'
    // Значення: найкращий результат
    [leaderboardKey: string]: number;
}

// === КОЛЕКЦІЯ: scores (Історія ігор) ===
export interface ScoreDocument {
    uid: string;
    displayName: string | null;

    // Метадані гри
    gameMode: string;      // 'timed', 'survival', 'arena'
    boardSize: number;     // 4, 8, etc.
    variant?: string;      // 'classic', 'hardcore'

    // Результат
    score: number;         // Основний показник (очки, час, ходи)
    secondaryScore?: number; // Додатковий показник (наприклад, час при грі на очки)

    timestamp: number | Timestamp;

    // Технічне поле для сортування та фільтрації
    // Формат: {gameMode}_{boardSize} (наприклад: 'timed_4')
    leaderboardKey: string;
}

// === КОЛЕКЦІЯ: feedback ===
export interface FeedbackDocument {
    type: 'bug' | 'improvement' | 'other' | 'reward_suggestion';
    text: string;
    context: Record<string, any>;
    status: 'new' | 'read' | 'implemented';
    createdAt: number | Timestamp;
}