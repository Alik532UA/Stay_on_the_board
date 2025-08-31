# План реалізації: Блокування налаштувань для змагальних режимів

**Мета:** Реалізувати механізм блокування певних налаштувань для змагальних режимів (`timed`, `local`, `online`) згідно з вимогами.

1.  **Створити файл документації:**
    -   [x] Створити файл `docs/features/timed-mode-settings-lock.md` для опису нової логіки.

2.  **Модифікувати `SettingsExpanderWidget.svelte`:**
    -   [ ] Додати отримання поточного активного режиму гри зі стору `gameModeStore`.
    -   [ ] Створити похідну змінну (derived store або `$:`) `isCompetitiveMode`, яка буде `true`, якщо активний режим — `timed`, `local` або `online`.
    -   [ ] В розмітці, приховати блок вибору пресетів (`.settings-expander__game-mode-row`) за допомогою `{#if !isCompetitiveMode}`.
    -   [ ] Додати новий CSS клас, наприклад `.locked-setting`, який встановлює `opacity: 0.5;` та `cursor: help;`.
    -   [ ] Застосувати клас `.locked-setting` до кнопок видимості, `auto-hide-board-toggle`, та `block-mode-toggle`, якщо `isCompetitiveMode` є `true`.
    -   [ ] Створити функцію `showCompetitiveModeModal()`, яка буде відповідати за показ модального вікна.
    -   [ ] Оновити обробники `on:click` для заблокованих елементів: якщо `isCompetitiveMode` є `true`, викликати `showCompetitiveModeModal()`, інакше — виконувати стару логіку зміни налаштувань.

3.  **Реалізувати логіку модального вікна в `SettingsExpanderWidget.svelte`:**
    -   [ ] У функції `showCompetitiveModeModal()`:
        -   Використовувати `modalStore.showModal()`.
        -   **titleKey:** `'modal.competitiveModeLockTitle'`
        -   **contentKey:** `'modal.competitiveModeLockContent'`
        -   **buttons:**
            -   Кнопка "Перейти до тренування": `textKey: 'modal.goToTraining'`, `onClick` має викликати `goto('/game/training')`. Потрібно імпортувати `goto` з `$app/navigation`.
            -   Кнопка "Залишитися": `textKey: 'modal.stay'`, `onClick` має викликати `modalStore.closeModal()`.

4.  **Додати нові ключі перекладу:**
    -   [ ] Додати `modal.competitiveModeLockTitle` та `modal.competitiveModeLockContent` у всі файли локалізації (`src/lib/i18n/lang/`).
    -   [ ] Додати `modal.goToTraining` та `modal.stay` у всі файли локалізації.

5.  **Тестування:**
    -   [ ] Перевірити, що на сторінці `/game/timed` блок з пресетами прихований, а налаштування виглядають заблокованими.
    -   [ ] Перевірити, що клік на заблоковані налаштування викликає модальне вікно з правильним текстом.
    -   [ ] Перевірити, що кнопки в модальному вікні працюють коректно.
    -   [ ] Перевірити, що в режимі `/game/training` всі налаштування розблоковані і працюють як і раніше.
