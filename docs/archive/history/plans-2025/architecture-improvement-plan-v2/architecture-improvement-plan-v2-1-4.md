Звісно. Оновлення тестів — це критично важливий крок після рефакторингу. Якщо тести продовжують проходити після зміни архітектури, це дає високу впевненість у тому, що основна логіка не була зламана.

---

### Детальний План: Оновлення `gameCore.test.js`

**Мета:** Адаптувати тестовий файл до нової структури проєкту, де всі чисті функції ігрової логіки тепер знаходяться в `gameLogicService.ts`, а не в `gameCore.ts`.

---

#### Крок 1: Перейменування тестового файлу

Оскільки ми тестуємо логіку, яка тепер є частиною `gameLogicService`, має сенс перейменувати і сам тестовий файл для ясності.

1.  **Перейменуйте файл:**
    *   `src/lib/gameCore.test.js` -> `src/lib/services/gameLogicService.test.js`

**Пояснення:** Ця зміна не є обов'язковою для роботи, але вона покращує структуру проєкту і робить очевидним, який модуль тестується.

---

#### Крок 2: Оновлення імпортів у тестовому файлі

Це головний крок, який виправить помилки, що виникають при запуску тестів.

1.  **Відкрийте (вже перейменований) файл:** `src/lib/services/gameLogicService.test.js`
2.  **Знайдіть рядок з імпортами** на початку файлу.
3.  **Змініть шлях**, з якого імпортуються функції.

    **Було:**
    ```javascript
    import { describe, it, expect } from 'vitest';
    import {
      createEmptyBoard,
      getRandomCell,
      getAvailableMoves,
      calculateFinalScore,
      countJumpedCells
    } from '../gameCore'; // <-- СТАРИЙ ШЛЯХ (або './gameCore')
    ```

    **Стане:**
    ```javascript
    import { describe, it, expect } from 'vitest';
    import {
      createEmptyBoard,
      getRandomCell,
      getAvailableMoves,
      calculateFinalScore,
      countJumpedCells
    } from './gameLogicService'; // <-- НОВИЙ, ПРАВИЛЬНИЙ ШЛЯХ
    ```

**Пояснення:**
*   Ми змінили джерело імпорту з `gameCore` на `gameLogicService`.
*   Оскільки тестовий файл і сервіс знаходяться в одній папці (`src/lib/services/`), ми можемо використовувати відносний шлях `./gameLogicService`. Vitest коректно обробить розширення `.ts`.

---

### Фінальний вигляд `gameLogicService.test.js`

Після змін файл повинен виглядати так:

```javascript
import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  getRandomCell,
  getAvailableMoves,
  calculateFinalScore,
  countJumpedCells
} from './gameLogicService';

// createEmptyBoard(size)
describe('createEmptyBoard', () => {
  it('створює дошку правильного розміру, заповнену нулями', () => {
    const size = 4;
    const board = createEmptyBoard(size);
    expect(board.length).toBe(size);
    expect(board.every(row => row.length === size)).toBe(true);
    expect(board.flat().every(cell => cell === 0)).toBe(true);
  });
});

// ... (решта тестів залишаються без змін) ...
```

---

### Результат та Перевірка

-   **Виправлення тестів:** Тестовий набір тепер буде імпортувати функції з правильного місця.
-   **Підтвердження рефакторингу:** Після виправлення, запустіть тести.

    ```bash
    npm run test
    ```

    Якщо всі тести пройдуть успішно, це буде надійним підтвердженням того, що під час перенесення чистих функцій з `gameCore.ts` до `gameLogicService.ts` їхня логіка не була випадково змінена чи зламана.

Це завершує адаптацію тестів до нової архітектури.