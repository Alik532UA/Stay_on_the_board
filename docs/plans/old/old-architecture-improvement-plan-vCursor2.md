# Об'єднаний план покращення архітектури (vUnited)

**Мета:** Підготувати архітектуру до масштабування, розширення ігрових режимів ("Локальна гра", "Гра онлайн"), підвищити якість, продуктивність і підтримуваність коду.

---

## 1. SSoT (Single Source of Truth)
- [ ] Об'єднати ключові ігрові стори у єдиний `gameStore` (стан, інпут, анімація).
    - [ ] Перенести всі поля з `gameState`, `playerInputStore`, `animationStore` у новий `gameStore`.
    - [ ] Додати типи/інтерфейси для стану кожного режиму (локальний, онлайн).
    - [ ] Всі глобальні налаштування (theme, language) — окремо від ігрового стану.
    - [ ] Всі збереження/відновлення стану — централізовано через окремий сервіс.
    - [ ] Винести анімаційний стан у UI-компоненти або окремий підрозділ `gameStore` (UIState).

## 2. UDF (Unidirectional Data Flow)
- [ ] Всі зміни стану — лише через екшени/методи (`gameActions.ts`).
    - [ ] Заборонити прямі мутації/виклики `.update()` з компонентів.
    - [ ] Винести побічні ефекти (таймери, API, аудіо) у окремі сервіси.
    - [ ] Впровадити middleware для логування/аналітики.
    - [ ] Додати unit-тести для екшенів та потоків даних.

## 3. SoC (Separation of Concerns)
- [ ] Розвантажити `gameOrchestrator.js`:
    - [ ] Логіку ходу комп'ютера винести в `playerAgents.js`.
    - [ ] Логіку завершення гри, показу модалок — у `modalService.js` або `uiService.js`.
- [ ] Винести логіку з компонентів у стори/сервіси:
    - [ ] Всі обчислення стану (наприклад, `centerInfoState`) — у derived store.
    - [ ] Всі обробки результатів гри — у orchestrator/service, а не в UI.
- [ ] Всі сервіси (логування, модалки, аудіо, storage) — окремими модулями з чіткими інтерфейсами.

## 4. Композиція та UI
- [ ] Впровадити патерн "контейнер-презентер": логіка — у контейнері, UI — у презентерах.
- [ ] Всі віджети мають бути максимально dumb (тільки props, мінімум стану).
- [ ] Всі layout-и — через конфігураційні об'єкти.
- [ ] Додати приклади використання компонентів у Storybook/Docs.
- [ ] Створити універсальний компонент для плаваючих кнопок (`FloatingButton.svelte`).

## 5. Чистота та Побічні ефекти
- [ ] Винести всі підписки, таймери, API у кастомні стори/сервіси.
- [ ] Всі побічні ефекти — через єдиний entry-point (екшени/сервіси).
- [ ] Централізувати роботу з `localStorage` через `storageService.js`.
- [ ] Впровадити тестування побічних ефектів.
- [ ] Додати документацію щодо побічних ефектів.

## 6. DRY (Don't Repeat Yourself)
- [ ] Винести спільну логіку (обробка ходів, підрахунок балів, хоткеї) у утиліти/core/сервіси.
- [ ] Уникати дублювання стилів — централізувати CSS, провести аудит стилів.
- [ ] Всі константи (напрямки, бонуси) — у окремі файли.
- [ ] Додати лінтер на дублювання коду.

## 7. KISS (Простота та Читабельність)
- [ ] Рефакторити великі реактивні блоки на простіші функції.
- [ ] Всі складні обчислення — у утиліти.
- [ ] Впровадити ESLint/Prettier для підтримки стилю коду.
- [ ] Додати code review чеклист для простоти.
- [ ] Спростити структуру стану: розділити на `SharedState` (для онлайн) та `UIState` (локальний).

## 8. Продуктивність
- [ ] Оптимізувати підписки: уникати зайвих реакцій на незначні зміни.
- [ ] Впровадити мемоізацію для важких обчислень.
- [ ] Для онлайн-режиму — оптимізувати синхронізацію (мінімізувати кількість оновлень).
- [ ] Додати профілювання рендерів та обчислень.
- [ ] Оптимізувати derived-стори (перевірити залежності).
- [ ] Проаналізувати анімації: використовувати CSS-трансформації, уникати layout thrashing.

## 9. Документація та Коментарі
- [ ] Додати README для кожного модуля/режиму.
- [ ] Всі складні рішення — пояснювати "навіщо" у коментарях (JSDoc).
- [ ] Впровадити шаблон для опису нових компонентів/модулів.
- [ ] Додати розділ "Архітектурні рішення" у документацію (`ARCHITECTURE.md`).
- [ ] Оновити/очистити застарілі коментарі, додати пояснення для складних рішень.

---

### Додаткові кроки для масштабування під нові режими
- [ ] Впровадити інтерфейс для підключення нових ігрових режимів (factory/pattern).
- [ ] Всі режими мають спільний API для інтеграції з UI та сервісами.
- [ ] Додати тест-кейси для сценаріїв перемикання режимів (локальний/онлайн).

---

**Примітка:**
- Всі чекбокси — для зручності відмітки виконаних пунктів.
- План можна деталізувати під конкретні задачі/спринти.
