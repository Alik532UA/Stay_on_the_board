# План уніфікації `data-testid` для надійного тестування

**Мета:** Впровадити єдину, масштабовану систему для атрибутів `data-testid` у всьому додатку. Це забезпечить стабільність E2E-тестів, спростить їх написання та підтримку, а також зробить ідентифікацію елементів передбачуваною.

## 1. Загальна конвенція іменування (SSoT & KISS)

Щоб уникнути дублювання та неоднозначності, всі `data-testid` повинні слідувати єдиному шаблону:

**`page-component-element[-modifier]`**

-   **page:** Назва сторінки або основного розділу (напр., `main-menu`, `local-setup`, `game-board`).
-   **component:** Назва компонента, до якого належить елемент (`modal`, `player-manager`, `score-panel`).
-   **element:** Опис самого елемента (`title`, `confirm-btn`, `player-name-input`).
-   **modifier (опціонально):** Унікальний ідентифікатор для елементів у списках або з різними станами (напр., індекс гравця, назва режиму).

**Приклад:** `local-setup-player-manager-add-player-btn`

## 2. Системне рішення для модальних вікон (SoC & UDF)

Проблема з `data-testid` у модальних вікнах виникала через їх динамічну природу та відсутність централізованої логіки.

-   **Файл:** `src/lib/components/Modal.svelte`
-   **Джерело правди (SSoT):** Функція `showModal` у `src/lib/stores/modalStore.js` повинна бути єдиним місцем, де задається базовий `data-testid` для модального вікна (напр., `game-mode-modal`, `expert-mode-modal`).
-   **Потік даних (UDF):** `modalStore` передає цей базовий ID до компонента `Modal.svelte`.
-   **Розділення відповідальності (SoC):** Компонент `Modal.svelte` відповідає за побудову повних `data-testid` для своїх внутрішніх елементів на основі отриманого базового ID.

**Оновлена конвенція для модальних вікон:**

-   **Контейнер вікна:** `{baseTestId}` (напр., `game-mode-modal`)
-   **Заголовок:** `{baseTestId}-title`
-   **Контент:** `{baseTestId}-content`
-   **Кнопка:** `{baseTestId}-{action}-btn` (напр., `game-mode-modal-confirm-btn`)
-   **Чекбокс "Не показувати знову":** `{baseTestId}-dont-show-again-switch`

**Завдання:**
-   [x] **(Виконано)** Модифікувати `Modal.svelte`, щоб він генерував `data-testid` для дочірніх елементів, додаючи суфікси до базового `dataTestId` з `$modalState`.
-   [ ] Провести ревізію всіх викликів `showModal` у коді та переконатися, що для кожного модального вікна передається унікальний та осмислений `dataTestId`.

## 3. Кроки реалізації

### 3.1. Головне меню

-   **Файл:** `src/lib/components/MainMenu.svelte`
-   **Завдання:**
    -   [ ] Контейнер: `main-menu-container`
    -   [ ] Кнопки: `main-menu-vs-computer-btn`, `main-menu-local-game-btn`, і т.д.

### 3.2. Налаштування локальної гри

-   **Файл:** `src/lib/components/local-setup/LocalGameSettings.svelte`
-   **Завдання:**
    -   [ ] Поля вводу: `local-setup-player-name-input-0`, `local-setup-player-name-input-1`, ...
    -   [ ] Кнопки гравців: `local-setup-add-player-btn`, `local-setup-remove-player-btn-0`, ...
    -   [ ] Кнопка старту: `local-setup-start-game-btn`

### 3.3. Ігровий інтерфейс (для всіх режимів)

-   **Файли:** `src/routes/game/vs-computer/+page.svelte`, `src/routes/game/local/+page.svelte` та відповідні компоненти.
-   **Завдання:**
    -   [ ] Дошка: `game-board`
    -   [ ] Панель інформації: `game-info-panel`
    -   [ ] Індикатор ходу: `game-player-turn-indicator`
    -   [ ] Кнопки керування: `game-controls-undo-btn`, `game-controls-redo-btn`

### 3.4. Заголовки та важливі тексти

-   **Завдання:**
    -   [ ] Переглянути ключові сторінки та компоненти, додаючи `data-testid` до важливих інформаційних блоків, які можуть перевірятися в тестах (напр., повідомлення про перемогу, поточний рахунок). Використовувати загальну конвенцію.
