# План: Покращення типізації з використанням конкретних типів

**Мета:** Підвищити надійність та якість кодової бази шляхом заміни неявних та явних типів `any` на конкретні, строго визначені типи. Централізувати визначення глобальних типів у `app.d.ts`.

**Принципи:** Дотримуватися принципів SSoT (для типів), KISS (використовувати найпростіший спосіб визначення типів) та покращувати документацію коду.

---

### Фаза 1: Глобальна типізація `window`

**Мета:** Централізувати визначення глобальних властивостей, доданих до об'єкта `window`, щоб уникнути використання `(window as any)`.

- **Дія:** Оновити файл `src/app.d.ts` для розширення глобального інтерфейсу `Window`.
- **Файл:** `src/app.d.ts`

- **Інструкція:** Відкрийте файл та додайте/оновіть його вміст, щоб він включав визначення для `setLogLevels` та інших кастомних властивостей, які можуть бути додані до `window`.

```typescript
// src/app.d.ts

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// ДОДАЙТЕ АБО ОНОВІТЬ ЦЕЙ БЛОК
	interface Window {
		// Додайте сюди всі властивості, які ви додаєте до window
		setLogLevels: (config: Record<string, boolean>) => void;
		testLocalGameStore: () => void; // Приклад з вашого коду
	}
}

export {};
```

---

### Фаза 2: Заміна `any` на конкретні типи (JSDoc та TypeScript)

**Мета:** Усунути помилки `noImplicitAny` та покращити автодоповнення, надаючи TypeScript точну інформацію про типи даних.

#### Крок 2.1: Виправлення параметрів у `subscribe`

- **Файл:** `src/lib/stores/gameStore.ts`
- **Проблема:** `Parameter 'state' implicitly has an 'any' type.`
- **Рішення:** Додати JSDoc-коментар з імпортом типу `GameState`.

- **Було:**
  ```typescript
  gameState.subscribe(state => {
    update(game => ({ ...game, state }));
  });
  ```
- **Стане:**
  ```typescript
  /** @param {import('./gameState.ts').GameState} state */
  gameState.subscribe(state => {
    update(game => ({ ...game, state }));
  });
  ```

- **Файл:** `src/lib/components/widgets/BoardWrapperWidget.svelte`
- **Проблема:** `Parameter '$gameState' implicitly has an 'any' type.`
- **Рішення:** Додати JSDoc-коментар з імпортом типу `GameState`.

- **Було:**
  ```typescript
  gameState.subscribe(($gameState) => {
    // ...
  });
  ```
- **Стане:**
  ```typescript
  /** @param {import('$lib/stores/gameState').GameState} $gameState */
  gameState.subscribe(($gameState) => {
    // ...
  });
  ```

#### Крок 2.2: Виправлення типів у тестах

**Проблема:** У тестах `get(gameState)` повертає тип `unknown`, що не дозволяє звертатися до властивостей стану.

- **Дія:** У всіх тестових файлах, де виникає ця помилка, додайте імпорт типу `GameState` та використовуйте `as` для приведення типу.

- **Файли:**
  - `src/lib/gameCore.test.ts`
  - `src/lib/services/gameLogicService.test.ts`
  - `src/lib/services/stateManager.test.ts`
  - `src/lib/stores/derivedState.test.ts`
  - `src/lib/stores/synchronization.test.ts`

- **Приклад виправлення:**

- **Було:**
  ```typescript
  // ...
  test('гра повинна ініціалізуватися правильно', () => {
    const state = get(gameState);
    expect(state.playerRow).toBe(0); // Помилка тут
  });
  ```
- **Стане:**
  ```typescript
  import type { GameState } from '$lib/stores/gameState.ts'; // <-- ДОДАТИ ІМПОРТ
  // ...
  test('гра повинна ініціалізуватися правильно', () => {
    const state = get(gameState) as GameState; // <-- ДОДАТИ ПРИВЕДЕННЯ ТИПУ
    expect(state.playerRow).toBe(0); // Тепер помилки немає
  });
  ```

#### Крок 2.3: Виправлення типів параметрів у `modalService.ts`

- **Файл:** `src/lib/services/modalService.ts`
- **Проблема:** `Parameter 'player' implicitly has an 'any' type.`
- **Рішення:** Імпортувати тип `Player` та вказати його для параметра.

- **Було:**
  ```typescript
  const playerScores = state.players.map((player, index) => ({
    // ...
  }));
  ```
- **Стане:**
  ```typescript
  import type { Player } from '$lib/stores/gameState.ts'; // <-- ДОДАТИ ІМПОРТ
  // ...
  const playerScores = state.players.map((player: Player, index: number) => ({
    // ...
  }));
  ```

---

### Фаза 3: Фінальна верифікація

- **Дія 1:** Запустіть команду `npm run check`.
- **Очікуваний результат:** `svelte-check found 0 errors and 0 warnings`.

- **Дія 2:** Запустіть додаток у режимі розробки (`npm run dev`).
- **Очікуваний результат:** Додаток завантажується та працює без помилок у консолі браузера. Перевірте функціонал, пов'язаний зі зміненими файлами (робота гри, модальних вікон, налаштувань).