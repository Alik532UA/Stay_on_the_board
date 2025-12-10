/**
 * Firebase Service
 * Централізована ініціалізація та експорт Firebase сервісів
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';
import { browser } from '$app/environment';

// Firebase конфігурація з змінних середовища Vite
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL // Додано для Realtime Database
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;
let analytics: Analytics | null = null;

/**
 * Перевіряє, чи налаштовано Firebase
 */
export function isFirebaseConfigured(): boolean {
    return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/**
 * Ініціалізує Firebase застосунок
 * Викликається лениво при першому зверненні до сервісів
 */
function initializeFirebase(): FirebaseApp {
    if (app) return app;

    // Перевіряємо, чи вже ініціалізовано (для HMR)
    const existingApps = getApps();
    if (existingApps.length > 0) {
        app = existingApps[0];
        return app;
    }

    if (!isFirebaseConfigured()) {
        throw new Error(
            'Firebase не налаштовано. Скопіюйте .env.example до .env та заповніть конфігурацію.'
        );
    }

    app = initializeApp(firebaseConfig);
    return app;
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
    // Якщо databaseURL не вказано в конфігу, Firebase спробує визначити його автоматично,
    // але краще вказати явно в .env
    rtdb = getDatabase(firebaseApp);
    return rtdb;
}

/**
 * Ініціалізує Google Analytics (тільки в браузері)
 */
export async function initializeAnalytics(): Promise<Analytics | null> {
    if (!browser) return null;
    if (analytics) return analytics;

    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn('Firebase Analytics не підтримується в цьому середовищі');
            return null;
        }

        const firebaseApp = initializeFirebase();
        analytics = getAnalytics(firebaseApp);
        return analytics;
    } catch (error) {
        console.error('Помилка ініціалізації Firebase Analytics:', error);
        return null;
    }
}

/**
 * Отримує Firebase App інстанс
 */
export function getFirebaseApp(): FirebaseApp {
    return initializeFirebase();
}