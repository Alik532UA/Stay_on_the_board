# План Покращення Архітектури v7

**Статус:** В процесі
**Дата:** 2025-07-24
**Мета:** Провести аудит поточної кодової бази, виявити слабкі місця та розробити покроковий план рефакторингу. Основний фокус — підготовка архітектури до масштабування та додавання нових ігрових режимів ("Локальна гра", "Гра онлайн").

## Покроковий План Покращення

### Архітектура та Структура

#### 1. SSoT (Single Source of Truth)

-   [ ] **Об'єднати ключові ігрові стори.** Створити єдиний `gameStore`, який буде містити `gameState`, `playerInputStore` та `animationStore`. Це створить єдиний, легко серіалізований об'єкт стану, що є критичним для онлайн-режиму.
    -   [ ] Перенести `playerRow`, `playerCol`, `board`, `score` і т.д. з `gameState` в новий `gameStore`.
    -   [ ] Перенести `selectedDirection`, `selectedDistance` в `gameStore` як частину стану поточного гравця (UI state).
    -   [ ] Ліквідувати `animationStore`, перенісши його логіку безпосередньо в компоненти, які будуть реагувати на зміни в `gameStore`. Анімація — це відповідальність UI, а не стану.

#### 2. UDF (Unidirectional Data Flow)

-   [ ] **Формалізувати потік дій.** Усі зміни ігрового стану повинні проходити виключно через `gameActions.ts`. Заборонити прямі виклики `.update()` для `gameStore` з компонентів.
    -   [ ] Провести ревізію коду на предмет прямих викликів `gameState.update()` або `playerInputStore.update()` з UI-компонентів та перенести їх у `gameActions`.

#### 3. SoC (Separation of Concerns)

-   [ ] **Розвантажити `gameOrchestrator.js`.** Перенести частину його логіки у більш спеціалізовані модулі.
    -   [ ] Логіку ходу комп'ютера (`triggerComputerMove`) винести в `playerAgents.js`.
    -   [ ] Логіку завершення гри та показу модальних вікон винести в `modalService.js` або новий `uiService.js`.
-   [ ] **Винести логіку з компонентів.**
    -   [ ] Перенести логіку визначення `centerInfoState` з `ControlsPanelWidget.svelte` у derived store, що базується на `gameStore`.
    -   [ ] Логіку обробки результатів гри (`$gameState.isGameOver` `$:`) з `GameBoard.svelte` перенести в `gameOrchestrator` або `uiService`.

#### 4. Композиція

-   [ ] **Створити універсальний компонент для плаваючих кнопок.** Об'єднати `FloatingBackButton.svelte` та `FloatingCloseButton.svelte` в один компонент `FloatingButton.svelte` з пропсами для іконки та дії.

#### 5. Чистота та Побічні ефекти

-   [ ] **Централізувати роботу з `localStorage`.** Створити `storageService.js` для інкапсуляції всієї логіки читання/запису в `localStorage`, щоб уникнути розкиданих викликів по коду.

### Якість Коду та Реалізації

#### 6. DRY (Don't Repeat Yourself)

-   [ ] **Провести аудит CSS.** Знайти та усунути дублювання стилів, які не покриваються існуючими змінними, створивши нові утилітарні класи або CSS-змінні.
-   [ ] **Уніфікувати логіку обробки хоткеїв.** Наразі вона частково в `SettingsExpanderWidget.svelte` та `GameBoard.svelte`. Створити єдиний сервіс `hotkeyService.js`, який буде слухати події та викликати відповідні дії з `gameActions`.

#### 7. Простота та Читабельність (KISS)

-   [ ] **Спростити структуру стану.** Після об'єднання сторів (пункт 1), чітко розділити інтерфейс стану на `SharedState` (для синхронізації онлайн) та `UIState` (локальний для кожного гравця).
-   [ ] **Рефакторинг `gameOrchestrator.js`.** Після розвантаження (пункт 3), переписати його, щоб він лише координував виклики між сервісами, а не містив складну логіку.

#### 8. Продуктивність

-   [ ] **Оптимізувати derived-стори.** Перевірити всі `$derived` та `derived()` на наявність зайвих залежностей, які можуть призводити до непотрібних переобчислень.
-   [ ] **Проаналізувати анімації.** Переконатися, що анімації (особливо руху ферзя та зникнення дошки) використовують CSS-трансформації (`transform`, `opacity`), а не властивості, що викликають перерахунок макета (layout thrashing), як-от `width` чи `height`.

#### 9. Документація та Коментарі

-   [ ] **Впровадити стандарт JSDoc.** Додати JSDoc-коментарі до всіх ключових функцій, сторів та їх властивостей. Особливу увагу приділити поясненню *навіщо* існує та чи інша частина коду.
-   [ ] **Створити `ARCHITECTURE.md`.** Описати в ньому основні принципи (SSoT, UDF, SoC), структуру сторів, потік даних та взаємодію ключових модулів. Це буде критично важливо для майбутніх розробників.
-   [ ] **Оновити коментарі в коді.** Пройтися по існуючих коментарях та оновити їх, видаливши застарілі та додавши пояснення для складних або неочевидних рішень.