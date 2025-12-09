# План: Міграція на Firebase для онлайн-режиму

**Статус:** До виконання
**Дата:** 2025-08-10

## 🎯 Мета

Повністю видалити застарілу логіку онлайн-гри на основі P2P (Y.js, WebRTC) та впровадити нове, надійне рішення на базі Firebase (Firestore) для синхронізації ігрових сесій та ведення глобальної таблиці лідерів.

---

### Фаза 1: Очищення від застарілої логіки P2P

**Мета:** Створити чисту кодову базу перед впровадженням нової логіки, щоб уникнути плутанини та конфліктів.

-   [x] **Видалення залежностей:**
    -   [x] Виконайте команду для видалення пакетів, пов'язаних з P2P, з вашого `package.json`.
        ```bash
        npm uninstall yjs y-webrtc socket.io-client
        ```

-   [x] **Видалення файлів:**
    -   [x] Видаліть файл `src/lib/online/yjs.js`.
    -   [x] Видаліть файл `src/lib/online/socket.js`.
    -   [x] Видаліть файл `src/lib/stores/yjsGameStore.js`.

-   [x] **Пошук та видалення залишків:**
    -   [x] Виконайте глобальний пошук по проєкту за ключовими словами `yjs`, `y-webrtc`, `socket.io`, `WebRTC`, `PeerJS`.
    -   [x] Видаліть усі імпорти та згадки цих технологій з компонентів (наприклад, з `OnlineMenu.svelte` або `JoinRoom.svelte`, якщо вони там використовувалися).

---

### Фаза 2: Налаштування та інтеграція Firebase

**Мета:** Налаштувати проєкт Firebase та інтегрувати його у SvelteKit додаток.

-   [ ] **Створення проєкту Firebase:**
    -   [ ] Перейдіть до [консолі Firebase](https://console.firebase.google.com/).
    -   [ ] Створіть новий проєкт (наприклад, "Stay on the Board").
    -   [ ] У налаштуваннях проєкту додайте новий веб-додаток та скопіюйте об'єкт конфігурації (`firebaseConfig`).

-   [ ] **Встановлення залежностей:**
    -   [ ] Встановіть офіційний SDK Firebase:
        ```bash
        npm install firebase
        ```

-   [ ] **Налаштування змінних середовища (для безпеки):**
    -   [ ] Створіть файл `.env` у корені проєкту (якщо його немає).
    -   [ ] Додайте ваші ключі з `firebaseConfig` у `.env` з префіксом `VITE_`:
        ```env
        VITE_FIREBASE_API_KEY="AIza..."
        VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
        VITE_FIREBASE_PROJECT_ID="your-project-id"
        VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
        VITE_FIREBASE_MESSAGING_SENDER_ID="..."
        VITE_FIREBASE_APP_ID="..."
        ```

-   [ ] **Створення сервісу ініціалізації Firebase:**
    -   [ ] Створіть файл `src/lib/services/firebaseService.ts`.
    -   [ ] Додайте код для ініціалізації Firebase, використовуючи змінні середовища:
        ```typescript
        // src/lib/services/firebaseService.ts
        import { initializeApp } from 'firebase/app';
        import { getFirestore } from 'firebase/firestore';

        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };

        const app = initializeApp(firebaseConfig);
        export const db = getFirestore(app);
        ```

-   [ ] **Налаштування бази даних та правил безпеки:**
    -   [ ] У консолі Firebase перейдіть до розділу **Firestore Database** та створіть базу даних.
    -   [ ] Перейдіть на вкладку **Rules** та замініть правила на наступні (для початку):
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Ігрові сесії: будь-хто може створювати, але читати/писати може лише учасник
            match /game_sessions/{sessionId} {
              allow read, write: if request.auth != null; // TODO: Додати перевірку на учасника гри
            }
            // Таблиця лідерів: будь-хто може читати, але писати може лише залогінений користувач
            match /leaderboard/{scoreId} {
              allow read: if true;
              allow write: if request.auth != null;
            }
          }
        }
        ```

---

### Фаза 2.5: Інтеграція з абстракцією синхронізації (НОВЕ)

**Мета:** Використати існуючу абстракцію `IGameStateSync` для реалізації Firebase синхронізації.

> [!IMPORTANT]
> Цей проект вже має абстракцію синхронізації стану в `src/lib/sync/`.
> - `IGameStateSync` - інтерфейс для синхронізації
> - `LocalGameStateSync` - локальна реалізація (поточна поведінка)
> - `OnlineGameMode` - вже підготовлений до прийому `IGameStateSync` через конструктор

-   [ ] **Створення FirebaseGameStateSync:**
    -   [ ] Створіть файл `src/lib/sync/FirebaseGameStateSync.ts`
    -   [ ] Реалізуйте інтерфейс `IGameStateSync`:
        ```typescript
        // src/lib/sync/FirebaseGameStateSync.ts
        import { doc, setDoc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
        import { db } from '$lib/services/firebaseService';
        import type { IGameStateSync, SyncableGameState, SyncMoveData, GameStateSyncCallback, GameStateSyncEvent } from './gameStateSync.interface';

        export class FirebaseGameStateSync implements IGameStateSync {
          private _sessionId: string | null = null;
          private _isConnected: boolean = false;
          private _subscribers: Set<GameStateSyncCallback> = new Set();
          private _unsubscribeFirestore: (() => void) | null = null;

          get sessionId(): string | null { return this._sessionId; }
          get isConnected(): boolean { return this._isConnected; }

          async initialize(sessionId?: string): Promise<void> {
            this._sessionId = sessionId || this.generateRoomId();
            // Підписка на зміни в Firestore
            const gameSessionRef = doc(db, 'game_sessions', this._sessionId);
            this._unsubscribeFirestore = onSnapshot(gameSessionRef, (docSnap) => {
              if (docSnap.exists()) {
                this._notifySubscribers({ type: 'state_updated', state: docSnap.data() as SyncableGameState });
              }
            });
            this._isConnected = true;
          }

          async pushState(state: SyncableGameState): Promise<void> {
            if (!this._sessionId) return;
            const gameSessionRef = doc(db, 'game_sessions', this._sessionId);
            await setDoc(gameSessionRef, state, { merge: true });
          }

          async pullState(): Promise<SyncableGameState | null> {
            if (!this._sessionId) return null;
            const gameSessionRef = doc(db, 'game_sessions', this._sessionId);
            const docSnap = await getDoc(gameSessionRef);
            return docSnap.exists() ? (docSnap.data() as SyncableGameState) : null;
          }

          async pushMove(moveData: SyncMoveData): Promise<void> {
            // Можна зберігати історію ходів окремо
          }

          subscribe(callback: GameStateSyncCallback): () => void {
            this._subscribers.add(callback);
            return () => this._subscribers.delete(callback);
          }

          async cleanup(): Promise<void> {
            if (this._unsubscribeFirestore) this._unsubscribeFirestore();
            this._isConnected = false;
          }

          private generateRoomId(): string {
            return Math.random().toString(36).substring(2, 8).toUpperCase();
          }

          private _notifySubscribers(event: GameStateSyncEvent): void {
            this._subscribers.forEach(cb => cb(event));
          }
        }
        ```

-   [ ] **Структура даних Firestore:**
    ```
    game_sessions/{sessionId}
    ├── boardState: BoardState      // Стан дошки
    ├── playerState: PlayerState    // Стан гравців
    ├── scoreState: ScoreState      // Рахунок
    ├── version: number             // Версія для конфліктів
    ├── updatedAt: number           // Timestamp
    ├── status: 'waiting' | 'playing' | 'finished'
    ├── hostId: string              // ID хоста
    └── moves: Move[]               // Історія ходів (опціонально)
    ```

-   [ ] **Обробка конфліктів:**
    -   [ ] Використовувати `version` для optimistic locking
    -   [ ] При конфлікті - повторити операцію з актуальним станом

-   [ ] **Офлайн-режим:**
    -   [ ] Увімкнути `enablePersistence()` в `firebaseService.ts`
    -   [ ] Показувати індикатор з'єднання в UI

---

### Фаза 3: Реалізація логіки онлайн-гри

**Мета:** Створити сервіси для керування ігровими сесіями та таблицею лідерів.

> [!NOTE]
> Замість створення окремого `onlineGameService.ts`, використовуйте `FirebaseGameStateSync`
> який реалізує інтерфейс `IGameStateSync`. Це забезпечує кращу архітектуру.

-   [ ] **Інтеграція FirebaseGameStateSync в OnlineGameMode:**
    -   [ ] В `OnlineGameMode` передати `FirebaseGameStateSync` через конструктор:
        ```typescript
        import { FirebaseGameStateSync } from '$lib/sync/FirebaseGameStateSync';
        
        // При створенні онлайн-гри:
        const firebaseSync = new FirebaseGameStateSync();
        const onlineMode = new OnlineGameMode(firebaseSync);
        await onlineMode.initialize({ roomId: 'ABC123' });
        ```

-   [ ] **Створення сервісу для таблиці лідерів:**
    -   [ ] Створіть файл `src/lib/services/leaderboardService.ts`.
    -   [ ] Реалізуйте методи для додавання результату та отримання списку лідерів.

-   [ ] **Інтеграція з UI:**
    -   [ ] Оновіть компоненти `OnlineMenu.svelte`, `JoinRoom.svelte` та `WaitingForPlayer.svelte`.
    -   [ ] При завершенні онлайн-гри викликайте `leaderboardService.addScore()`.

---

### Фаза 4: Деплой та фіналізація

-   [ ] **Налаштування GitHub Secrets:**
    -   [ ] У налаштуваннях вашого репозиторію на GitHub перейдіть до `Secrets and variables` -> `Actions`.
    -   [ ] Додайте всі ваші змінні з файлу `.env` (наприклад, `VITE_FIREBASE_API_KEY`) як секрети.

-   [ ] **Оновлення GitHub Actions Workflow:**
    -   [ ] У вашому файлі `.github/workflows/deploy.yml` (або аналогічному), перед кроком `npm run build`, додайте крок для створення файлу `.env` з секретів:
        ```yaml
        - name: Create .env file
          run: |
            echo VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }} >> .env
            echo VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }} >> .env
            # ... і так далі для всіх ключів
        ```

-   [ ] **Тестування:**
    -   [ ] Проведіть повне тестування онлайн-режиму, відкривши гру у двох різних браузерах.
    -   [ ] Перевірте, що таблиця лідерів оновлюється.
    -   [ ] Перевірте, що розгорнута на GitHub Pages версія працює коректно.