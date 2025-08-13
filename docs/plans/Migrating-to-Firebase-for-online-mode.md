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

### Фаза 3: Реалізація логіки онлайн-гри

**Мета:** Створити сервіси для керування ігровими сесіями та таблицею лідерів.

-   [ ] **Створення сервісу для онлайн-гри:**
    -   [ ] Створіть файл `src/lib/services/onlineGameService.ts`.
    -   [ ] Реалізуйте в ньому наступні методи:
        ```typescript
        import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
        import { db } from './firebaseService';
        import { gameState } from '$lib/stores/gameState'; // Приклад

        export const onlineGameService = {
          /** Створює нову ігрову кімнату в Firestore */
          createRoom: async (roomId: string) => {
            const gameSessionRef = doc(db, 'game_sessions', roomId);
            await setDoc(gameSessionRef, {
              // Початковий стан гри
              ...get(gameState),
              players: [], // Гравці будуть додаватися при підключенні
              createdAt: new Date(),
            });
          },

          /** Підписується на оновлення ігрової сесії */
          listenForUpdates: (roomId: string, callback: (data: any) => void) => {
            const gameSessionRef = doc(db, 'game_sessions', roomId);
            return onSnapshot(gameSessionRef, (doc) => {
              callback(doc.data());
            });
          },

          /** Надсилає хід гравця в Firestore */
          sendMove: async (roomId: string, moveData: any) => {
            const gameSessionRef = doc(db, 'game_sessions', roomId);
            await updateDoc(gameSessionRef, {
              // Оновлюємо лише ті поля, що змінилися
              ...moveData
            });
          },
        };
        ```

-   [ ] **Створення сервісу для таблиці лідерів:**
    -   [ ] Створіть файл `src/lib/services/leaderboardService.ts`.
    -   [ ] Реалізуйте методи для додавання результату та отримання списку лідерів.

-   [ ] **Інтеграція з UI:**
    -   [ ] Оновіть компоненти `OnlineMenu.svelte`, `JoinRoom.svelte` та `WaitingForPlayer.svelte`, щоб вони викликали методи з `onlineGameService`.
    -   [ ] У `gameOrchestrator` або в новому `OnlineGameMode` додайте логіку, яка буде викликати `onlineGameService.listenForUpdates` при вході в кімнату та оновлювати локальний `gameState` на основі даних з Firestore.
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