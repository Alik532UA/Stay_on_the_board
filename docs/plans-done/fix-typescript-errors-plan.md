# План виправлення помилок TypeScript

Цей план описує кроки для виправлення помилок, виявлених командою `npm run check`.

## Крок 1: Аналіз помилок

- [x] Запустити `npm run check` та проаналізувати вивід.
- [x] Згрупувати помилки за типами та файлами.

**Основні категорії помилок:**
1.  **Implicit `any` type:** Велика кількість помилок пов'язана з відсутністю явних типів для параметрів функцій та властивостей об'єктів.
2.  **Missing properties:** У тестах об'єкти гравців (`Player`) створюються без обов'язкової властивості `score`.
3.  **Incorrect properties:** У тестах до об'єкта `GameState` додається неіснуюча властивість `score`.
4.  **Incorrect indexing:** У `src/routes/game/+layout.svelte` відбувається спроба індексувати об'єкт, який не має індексної сигнатури.
5.  **Incorrect function calls:** У тестах функції викликаються з неправильною кількістю аргументів.

## Крок 2: Створення TODO-листа

- [-] Створити детальний TODO-лист для відстеження прогресу виправлень.

## Крок 3: Виправлення помилок

### 3.1. Файл: `src/lib/stores/appSettingsStore.ts`
- [ ] Додати явні типи для властивостей `selectedVoiceURI` та `gameMode`.
- [ ] Додати явні типи для параметрів функції `safeJsonParse`.
- [ ] Додати явний тип для параметра `style` у функції `convertStyle`.
- [ ] Виправити помилку індексації в `convertStyle`, додавши індексну сигнатуру до об'єкта `conversions`.
- [ ] Додати явні типи для параметрів `newSettings`, `level`, `key`, `action`, `forceState`, `desiredState`.
- [ ] Додати явний тип для властивості `blocked` в `initialGameState`.

### 3.2. Файли тестів (різні)
- [ ] Додати властивість `score: 0` до всіх об'єктів гравців (`Player`) у файлах:
    - `src/tests/game-logic-test.js`
    - `src/tests/game-logic.test.js`
    - `src/tests/local-game-integration.test.js`
    - `src/tests/local-game-messages.test.js`
    - `src/tests/local-game-score.test.js`
    - `src/tests/multiplayer-logic.test.js`
    - `src/tests/out-of-bounds-move.test.js`
    - `src/tests/replay-functionality.test.js`
    - `src/lib/gameCore.test.ts`
    - `src/lib/services/stateManager.test.ts`
    - `src/lib/stores/derivedState.test.ts`
    - `src/lib/stores/synchronization.test.ts`
- [ ] Видалити неіснуючу властивість `score` з об'єктів `GameState` у файлах:
    - `src/tests/local-game-integration.test.js`
    - `src/tests/local-game-messages.test.js`
    - `src/lib/gameCore.test.ts`
    - `src/lib/services/gameLogicService.test.ts`
    - `src/lib/services/stateManager.test.ts`
    - `src/lib/stores/derivedState.test.ts`
    - `src/lib/stores/synchronization.test.ts`

### 3.3. Інші виправлення
- [ ] `src/tests/out-of-bounds-move.test.js`: Виправити мок `performMove`, додавши відсутні властивості `bonusPoints` та `penaltyPoints`.
- [ ] `src/tests/out-of-bounds-move.test.js`: Виправити мок `_triggerComputerMove`, передавши необхідний аргумент.
- [ ] `src/lib/gameCore.test.ts`: Виправити виклики `performMove`, передавши правильну кількість аргументів.
- [ ] `src/routes/game/+layout.svelte`: Виправити помилку індексації, додавши індексну сигнатуру до типу `resolutions`.

## Крок 4: Верифікація
- [ ] Запустити `npm run check` ще раз, щоб переконатися, що всі помилки виправлено.
- [ ] Повідомити про завершення роботи.