Звісно. Цей крок є фінальним етапом формалізації архітектури. Ми об'єднаємо розрізнені файли з ігровою логікою (`gameCore.ts` та `gameActions.ts`) в єдиний, цілісний сервіс. Це зробить структуру проєкту ще більш зрозумілою та підготовленою до масштабування.

---

### Детальний План: Створення `GameLogicService`

**Мета:** Створити єдиний файл `src/lib/services/gameLogicService.ts`, який буде містити всю логіку, пов'язану з правилами гри та зміною стану `gameState`. Це покращить інкапсуляцію та спростить імпорти в інших частинах додатку.

---

#### Крок 1: Створення нового файлу `gameLogicService.ts`

Ми створимо новий файл і перенесемо в нього вміст `gameCore.ts` та `gameActions.ts`.

1.  **Створіть новий файл:** `src/lib/services/gameLogicService.ts`
2.  **Скопіюйте весь вміст** з `src/lib/gameCore.ts` і вставте його в новий файл `gameLogicService.ts`.
3.  **Скопіюйте весь вміст** з `src/lib/stores/gameActions.ts` і вставте його **нижче** коду з `gameCore.ts` у тому ж файлі `gameLogicService.ts`.

Тепер у нас є один файл з усім необхідним кодом.

---

#### Крок 2: Рефакторинг та об'єднання коду в `gameLogicService.ts`

Ми структуруємо код всередині нового файлу, щоб він виглядав як єдиний сервіс, і виправимо внутрішні посилання.

1.  **Відкрийте файл:** `src/lib/services/gameLogicService.ts`
2.  **Оновіть імпорти:** Переконайтеся, що всі імпорти знаходяться нагорі файлу і не дублюються. Видаліть `import * as core from '$lib/gameCore.js';`, оскільки всі функції з `gameCore` тепер знаходяться в цьому ж файлі.
3.  **Виправте виклики функцій:** Знайдіть усі місця, де використовувався префікс `core.` (наприклад, `core.getRandomCell`) і видаліть його, оскільки функції тепер знаходяться в тій же області видимості.

    **Приклад:**
    **Було:**
    ```typescript
    const { row, col } = core.getRandomCell(size);
    // ...
    newState.availableMoves = core.getAvailableMoves(row, col, size, {}, get(appSettingsStore).blockOnVisitCount);
    ```
    **Стане:**
    ```typescript
    const { row, col } = getRandomCell(size);
    // ...
    newState.availableMoves = getAvailableMoves(row, col, size, {}, get(appSettingsStore).blockOnVisitCount);
    ```

4.  **Структуруйте експорти:** Замість того, щоб експортувати кожну функцію окремо, ми можемо згрупувати їх в один об'єкт-сервіс для чистоти, хоча іменовані експорти також є прийнятним варіантом. Для простоти залишимо іменовані експорти, оскільки це вимагатиме менше змін у файлах, що їх використовують.

**Очікуваний результат для `gameLogicService.ts`:**
```typescript
// src/lib/services/gameLogicService.ts

// --- ІМПОРТИ ---
import { get } from 'svelte/store';
import { gameState, createInitialState } from '../stores/gameState.js';
import { playerInputStore } from '../stores/playerInputStore.js';
import { replayStore } from '../stores/replayStore.js';
import { appSettingsStore } from '../stores/appSettingsStore.js';
// ... інші імпорти ...

// --- ТИПИ ТА КОНСТАНТИ (з колишнього gameCore.ts) ---
export type Direction = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right';
// ... інші типи та константи ...

// --- ЧИСТІ ФУНКЦІЇ (з колишнього gameCore.ts) ---
export function createEmptyBoard(size: number): number[][] { /* ... */ }
export function getRandomCell(size: number): { row: number; col: number } { /* ... */ }
export function getAvailableMoves(/* ... */): Move[] { /* ... */ }
// ... інші чисті функції ...

// --- ФУНКЦІЇ-МУТАТОРИ (з колишнього gameActions.ts) ---
export function resetGame(options: { newSize?: number } = {}) {
  // ... (тут вже використовуються getRandomCell, getAvailableMoves без префікса `core.`)
}
export function performMove(newRow: number, newCol: number) { /* ... */ }
export function updateAvailableMoves() { /* ... */ }
export function setDirection(dir: Direction) { /* ... */ }
export function setDistance(dist: number) { /* ... */ }

// ... інші функції-мутатори, які ми вирішили залишити чистими ...
```

---

#### Крок 3: Оновлення імпортів у всьому проєкті

Тепер найважливіша частина: потрібно знайти всі файли, які імпортували щось з `gameCore.ts` або `gameActions.ts`, і змінити шлях імпорту на новий сервіс.

1.  **Виконайте пошук по всьому проєкту** за рядками:
    *   `from '$lib/gameCore.js'`
    *   `from '$lib/gameCore.ts'`
    *   `from '$lib/stores/gameActions.js'`
    *   `from '$lib/stores/gameActions.ts'`

2.  **Для кожного знайденого файлу замініть шлях імпорту:**

    **Приклад в `gameOrchestrator.js`:**
    **Було:**
    ```javascript
    import * as gameActions from './stores/gameActions.js';
    import * as core from './gameCore.js';
    ```
    **Стане:**
    ```javascript
    import * as gameLogicService from '$lib/services/gameLogicService.js';
    // І далі по коду замінити `gameActions.` на `gameLogicService.` та `core.` на `gameLogicService.`
    ```
    Або, що краще, імпортувати лише потрібні функції:
    ```javascript
    import { resetGame, performMove, updateAvailableMoves, endGame, dirMap, oppositeDirections, calculateFinalScore } from '$lib/services/gameLogicService.js';
    ```

3.  **Оновіть файли, де це потрібно:**
    *   `src/lib/gameOrchestrator.js`
    *   `src/lib/playerAgents.js`
    *   `src/lib/components/widgets/ControlsPanelWidget.svelte`
    *   `src/lib/components/widgets/SettingsExpanderWidget.svelte`
    *   `src/lib/gameCore.test.js` (дуже важливо оновити тести!)

    **Приклад оновлення тесту `gameCore.test.js`:**
    **Було:**
    ```javascript
    import {
      createEmptyBoard,
      getRandomCell,
      // ...
    } from './gameCore';
    ```
    **Стане:**
    ```javascript
    import {
      createEmptyBoard,
      getRandomCell,
      // ...
    } from './services/gameLogicService'; // Шлях може бути відносним
    ```

---

#### Крок 4: Видалення старих файлів

Після того, як ви оновили всі імпорти і переконалися, що проєкт збирається і працює (`npm run dev` та `npm run check`), можна безпечно видалити старі файли.

1.  **Видаліть файл:** `src/lib/gameCore.ts`
2.  **Видаліть файл:** `src/lib/stores/gameActions.ts`

---

### Результат та Перевірка

-   **Інкапсуляція:** Вся логіка гри тепер знаходиться в одному місці, що відповідає принципу високої зв'язності (high cohesion).
-   **Спрощена структура:** Кількість файлів, що відповідають за логіку, зменшилася. Новим розробникам буде легше знайти потрібний код.
-   **Чіткі межі:** Тепер у нас є чітке розділення:
    *   `gameLogicService.ts`: **Що** і **Як** робити з ігровим станом.
    *   `gameOrchestrator.js`: **Коли** і в **Якій послідовності** викликати логіку.
    *   Стори (`gameState`, `appSettingsStore`): **Де** зберігається стан.
    *   Компоненти (`*.svelte`): **Як** відображати стан.

**Що протестувати:**
Це масштабний рефакторинг, тому потрібне **повне регресійне тестування**. Перевірте абсолютно всі аспекти гри, які ви тестували на попередніх кроках:
1.  Старт нової гри, скидання.
2.  Зміна розміру дошки.
3.  Ходи гравця та комп'ютера.
4.  Робота `center-info`.
5.  Нарахування балів та штрафів.
6.  Робота всіх режимів (блокування, прихована дошка/фігура).
7.  Завершення гри та показ модальних вікон.
8.  Робота реплею.
9.  Робота гарячих клавіш.