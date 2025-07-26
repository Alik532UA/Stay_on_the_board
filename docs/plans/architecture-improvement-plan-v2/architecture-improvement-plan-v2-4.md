Звісно, ось детальний покроковий план для оновлення JSDoc-коментарів у файлі `gameOrchestrator.js`.

# План оновлення JSDoc у `gameOrchestrator.js` для покращення типізації

**Мета:** Покращити статичний аналіз коду та усунути потенційні помилки типів, які може виявити `svelte-check` або VS Code. Додавання точних JSDoc-коментарів дозволяє TypeScript правильно розуміти типи даних у JavaScript-файлах, що підвищує надійність коду та покращує досвід розробки (автодоповнення, підказки).

**Поточна проблема:** TypeScript не може автоматично визначити, що `move.direction` є конкретним типом `Direction`, а не просто рядком (`string`). Через це при спробі доступу до `directionEn[move.direction]` виникає помилка `Element implicitly has an 'any' type`, оскільки TypeScript не може гарантувати, що такий ключ існує в об'єкті `directionEn`.

---

### Крок 1: Знайти цільовий файл та метод

Першим кроком є навігація до правильного місця в кодовій базі.

- [ ] **Відкрити файл:** `src/lib/gameOrchestrator.js`.
- [ ] **Знайти метод:** `_handleComputerMoveSideEffects(move)`.

### Крок 2: Додати JSDoc-коментар для об'єкта `directionEn`

Ми явно вкажемо TypeScript, яку структуру має об'єкт `directionEn`. Це дозволить йому валідувати ключі, які ми використовуємо для доступу.

- [ ] **Знайти визначення `directionEn`.**

    **Поточний код (приклад):**
    ```javascript
    // src/lib/gameOrchestrator.js -> _handleComputerMoveSideEffects

    if (speechLang.startsWith('en')) {
      const directionEn = {
        'up-left': 'up left', 'up': 'up', 'up-right': 'up right',
        'left': 'left', 'right': 'right',
        'down-left': 'down left', 'down': 'down', 'down-right': 'down right'
      };
      // ...
    }
    ```

- [ ] **Додати JSDoc-коментар над визначенням `directionEn`.**
    Цей коментар імпортує тип `Direction` з `gameLogicService` і повідомляє TypeScript, що ключами об'єкта можуть бути лише значення цього типу.

    **Оновлений код:**
    ```javascript
    // src/lib/gameOrchestrator.js -> _handleComputerMoveSideEffects

    if (speechLang.startsWith('en')) {
      /** @type {Record<import('$lib/services/gameLogicService').Direction, string>} */
      const directionEn = {
        'up-left': 'up left', 'up': 'up', 'up-right': 'up right',
        'left': 'left', 'right': 'right',
        'down-left': 'down left', 'down': 'down', 'down-right': 'down right'
      };
      // ...
    }
    ```

### Крок 3: Привести тип для `move.direction`

Тепер, коли TypeScript знає структуру `directionEn`, нам потрібно явно вказати, що `move.direction` відповідає цьому типу. Ми зробимо це за допомогою "type casting" у JSDoc.

- [ ] **Знайти рядок, де використовується `move.direction`.**

    **Поточний код (приклад):**
    ```javascript
    // src/lib/gameOrchestrator.js -> _handleComputerMoveSideEffects

    // ...
    textToSpeak = `${move.distance} ${directionEn[move.direction] ?? move.direction}.`;
    // ...
    ```

- [ ] **Додати явне приведення типу для `move.direction`.**
    Це можна зробити, створивши нову змінну `dirKey` з правильним типом.

    **Оновлений код:**
    ```javascript
    // src/lib/gameOrchestrator.js -> _handleComputerMoveSideEffects

    // ...
    const dirKey = /** @type {import('$lib/services/gameLogicService').Direction} */ (move.direction);
    textToSpeak = `${move.distance} ${directionEn[dirKey] ?? move.direction}.`;
    // ...
    ```

### Крок 4: Верифікація

Після внесення змін необхідно переконатися, що вони вирішили проблему і не зламали існуючу функціональність.

- [ ] **Запустити перевірку типів.**
    Виконайте команду в терміналі, щоб переконатися, що помилка типізації зникла:
    ```bash
    npm run check
    ```
    **Очікуваний результат:** `✔ No errors found`.

- [ ] **Провести функціональне тестування.**
    1.  Запустіть гру (`npm run dev`).
    2.  У налаштуваннях увімкніть "Озвучування ходів".
    3.  Зробіть хід, щоб комп'ютер відповів.
    4.  **Очікуваний результат:** Хід комп'ютера має бути озвучений коректно англійською мовою (якщо доступний англійський голос), наприклад, "2 down-left". Це підтвердить, що логіка озвучення не була порушена.