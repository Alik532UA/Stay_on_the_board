---
last-reviewed: 2025-08-07
---

# Архітектура Проєкту "Stay on the Board"

**Пов'язані документи:**
- [Onboarding для розробників](ONBOARDING.md)
- [Архітектура ігрового циклу та потоку даних](architecture/GAME_LOGIC_AND_DATA_FLOW.md)
- [Патерни асинхронної візуалізації стану](architecture/PATTERNS-asynchronous-state-visualization.md)

Цей документ описує основні архітектурні принципи, структуру стану та потік даних у застосунку.

## 1. Ключові Принципи

- **Single Source of Truth (SSoT):** Весь логічний стан гри зберігається в `gameState`. Інші стани (UI, налаштування) зберігаються у власних спеціалізованих сторах. Похідні дані обчислюються за допомогою `derived` сторів.
- **Unidirectional Data Flow (UDF):** Потік даних є односпрямованим:
  1.  **UI (Компонент)** викликає дію з **`GameOrchestrator`**.
  2.  **`GameOrchestrator`** викликає чисті функції-мутатори з **`GameLogicService`**.
  3.  **`GameLogicService`** оновлює **`gameState`**.
  4.  **UI (Компонент)** реактивно оновлюється у відповідь на зміну стану.
- **Separation of Concerns (SoC):** Відповідальності чітко розділені між різними модулями (стори, сервіси, компоненти).

## 2. Схема Потоку Даних (UDF)

*На цьому місці ми створимо діаграму, яка візуалізує потік даних. Можна використовувати Mermaid синтаксис, який підтримується GitHub та багатьма редакторами.*

```mermaid
graph TD
    subgraph "UI Layer (Components)"
        A[ControlsPanelWidget] -->|1. on:click| B(GameOrchestrator);
        C[BoardWrapperWidget] --
>|4. subscribe| D(animationStore);
        E[MainMenu] -->|1. on:click| F(uiService);
    end

    subgraph "Service Layer"
        B -->|2. Виклик мутаторів| G(GameLogicService);
        F -->|Виклик дій| B;
        B -->|Побічні ефекти| H(AudioService);
        B -->|Побічні ефекти| I(NavigationService);
    end

    subgraph "State Layer (Stores)"
        G -->|3. update()| J[gameState];
        J -->|reacts to| K[derivedState];
        J -->|reacts to| D;
    end

    K -->|4. subscribe| A;
```

## 3. Опис Модулів

### 3.1. Стори (`src/lib/stores/`)

- **`gameState.ts`**: **SSoT для ігрової логіки.** Містить все, що стосується поточної партії: розмір дошки, позицію ферзя, рахунок, історію ходів, чергу ходів для анімації (`moveQueue`).
- **`settingsStore.js`**: **SSoT для налаштувань.** Зберігає вибір користувача: тема, мова, гарячі клавіші, стан чекбоксів. Зберігається в `localStorage`.
- **`playerInputStore.js`**: Зберігає **тимчасовий** стан вводу гравця (`selectedDirection`, `selectedDistance`). Скидається після кожного ходу.
- **`animationStore.js`**: **Сервіс-стор для візуалізації.** Підписується на `gameState.moveQueue` і відтворює анімації у власному темпі. Компоненти дошки залежать тільки від нього.
- **`derivedState.ts`**: Містить `derived` стори, які обчислюють похідні дані (наприклад, `lastComputerMove`, `centerInfo`), щоб уникнути складної логіки в компонентах.

### 3.2. Сервіси (`src/lib/services/`)

- **`gameLogicService.ts`**: **Бібліотека чистих функцій.** Містить всю логіку гри: правила (`getAvailableMoves`), мутатори стану (`resetGame`, `performMove`). Не містить побічних ефектів.
- **`gameOrchestrator.js`**: **"Мозок" гри.** Єдина точка входу для дій гравця. Координує виклики `gameLogicService`, запускає хід комп'ютера та керує побічними ефектами (аудіо, навігація).
- **`uiService.js`**: Містить логіку UI, не прив'язану до конкретного компонента (наприклад, логіка показу модального вікна вибору режиму при переході на `/game`).
- **`audioService.js` / `navigationService.js` / `logService.js` / `modalService.js`**: Ізольовані сервіси для керування відповідними побічними ефектами.

### 3.3. Компоненти (`src/lib/components/`)

- **Віджети (`widgets/`):** Компоненти, що є частиною ігрового екрану (`BoardWrapperWidget`, `ControlsPanelWidget` тощо). Вони є "тупими" і лише відображають дані зі сторів та викликають дії з сервісів.
- **Загальні компоненти:** Перевикористовувані елементи, такі як `Modal.svelte`, `FloatingBackButton.svelte`. 