# План: Віджет-повзунок для керування видимістю дошки

## 1. Створення нового компонента-віджета

- **Мета:** Створити новий компонент `BoardVisibilitySlider.svelte`.
- **Файл:** `src/lib/components/widgets/BoardVisibilitySlider.svelte`
- **Зміни:**
    - Створити повзунок (slider/range input) з чотирма станами.
    - Кожен стан повзунка буде відповідати певному рівню видимості:
        1.  **Приховано:** `showBoard: false`, `showQueen: false`, `showMoves: false`
        2.  **Лише дошка:** `showBoard: true`, `showQueen: false`, `showMoves: false`
        3.  **Показати фігуру:** `showBoard: true`, `showQueen: true`, `showMoves: false`
        4.  **Показати доступні ходи:** `showBoard: true`, `showQueen: true`, `showMoves: true`
    - Компонент буде оновлювати `settingsStore` при зміні значення повзунка.

## 2. Інтеграція нового віджета

- **Мета:** Додати новий віджет на сторінку налаштувань.
- **Файл:** `src/lib/components/local-setup/LocalGameSettings.svelte`
- **Зміни:**
    - Імпортувати та додати компонент `BoardVisibilitySlider.svelte`.
    - Розмістити його поруч з існуючими чекбоксами.

## 3. Оновлення `settingsStore`

- **Мета:** Забезпечити синхронізацію між повзунком та чекбоксами.
- **Файл:** `src/lib/stores/settingsStore.js`
- **Зміни:**
    - Додати логіку, яка буде оновлювати стан чекбоксів при зміні значення повзунка, і навпаки. Це можна зробити за допомогою `subscribe` на зміни в `settingsStore`.

## План виконання

1.  [ ] Створити файл `docs/plans/board-visibility-slider.md`.
2.  [ ] Створити файл `src/lib/components/widgets/BoardVisibilitySlider.svelte` з базовою розміткою та логікою.
3.  [ ] Проаналізувати `src/lib/components/local-setup/LocalGameSettings.svelte` для визначення місця вставки нового віджета.
4.  [ ] Інтегрувати `BoardVisibilitySlider.svelte` в `LocalGameSettings.svelte`.
5.  [ ] Проаналізувати `src/lib/stores/settingsStore.js` для додавання логіки синхронізації.
6.  [ ] Оновити `settingsStore.js` для синхронізації стану повзунка та чекбоксів.
7.  [ ] Протестувати новий функціонал.