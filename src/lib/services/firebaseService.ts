/**
 * Firebase Service
 * Централізована ініціалізація та експорт Firebase сервісів
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';
import { browser } from '$app/environment';
import { logService } from './logService';

// Firebase конфігурація з змінних середовища Vite
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;
let analytics: Analytics | null = null;

/**
 * Перевіряє, чи налаштовано Firebase
 */
export function isFirebaseConfigured(): boolean {
    const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
    if (!isConfigured) {
        logService.error('[FirebaseService] Missing configuration. Check .env file.', {
            hasApiKey: !!firebaseConfig.apiKey,
            hasProjectId: !!firebaseConfig.projectId,
            projectId: firebaseConfig.projectId // Безпечно логувати ID проекту
        });
    } else {
        // Логуємо один раз при перевірці, щоб знати, що конфіг є
        logService.init(`[FirebaseService] Configuration present for project: ${firebaseConfig.projectId}`);
    }
    return isConfigured;
}

/**
 * Ініціалізує Firebase застосунок
 */
function initializeFirebase(): FirebaseApp {
    if (app) return app;

    const existingApps = getApps();
    if (existingApps.length > 0) {
        app = existingApps[0];
        return app;
    }

    if (!isFirebaseConfigured()) {
        throw new Error('Firebase не налаштовано. Перевірте змінні середовища.');
    }

    try {
        app = initializeApp(firebaseConfig);
        logService.init('[FirebaseService] App initialized successfully');
        return app;
    } catch (e) {
        logService.error('[FirebaseService] Failed to initialize app', e);
        throw e;
    }
}

/**
 * Отримує Firestore інстанс
 */
export function getFirestoreDb(): Firestore {
    if (db) return db;
    const firebaseApp = initializeFirebase();
    db = getFirestore(firebaseApp);
    return db;
}

/**
 * Отримує Realtime Database інстанс
 */
export function getRealtimeDb(): Database {
    if (rtdb) return rtdb;
    const firebaseApp = initializeFirebase();
    rtdb = getDatabase(firebaseApp);
    return rtdb;
}

/**
 * Ініціалізує Google Analytics
 */
export async function initializeAnalytics(): Promise<Analytics | null> {
    if (!browser) return null;
    if (analytics) return analytics;

    try {
        const supported = await isSupported();
        if (!supported) return null;

        const firebaseApp = initializeFirebase();
        analytics = getAnalytics(firebaseApp);
        return analytics;
    } catch (error) {
        console.error('Помилка ініціалізації Firebase Analytics:', error);
        return null;
    }
}

export function getFirebaseApp(): FirebaseApp {
    return initializeFirebase();
}