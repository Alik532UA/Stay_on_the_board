# Базові/Стандартні Tooltips для Видалення

Цей документ містить список базових/стандартних tooltips, які були знайдені в Svelte-файлах і які потрібно видалити. Також наведено їхній український текст.

## Знайдені Tooltips та Їхній Український Текст:

1.  **Файл:** [`src/lib/components/widgets/PlayerTurnIndicator.svelte`](src/lib/components/widgets/PlayerTurnIndicator.svelte)
    *   **Код:** `title="{player.name}"`
    *   **Текст:** Динамічний, залежить від імені гравця.

2.  **Файл:** [`src/lib/components/widgets/ScorePanelWidget.svelte`](src/lib/components/widgets/ScorePanelWidget.svelte)
    *   **Код:** `title="Натисніть для перегляду деталей балів"`
    *   **Текст:** "Натисніть для перегляду деталей балів"
    *   **Код:** `title="Натисніть для перегляду деталей бонусних балів"`
    *   **Текст:** "Натисніть для перегляду деталей бонусних балів"

3.  **Файл:** [`src/lib/components/widgets/DevClearCacheButton.svelte`](src/lib/components/widgets/DevClearCacheButton.svelte)
    *   **Код:** `title="{$_('gameBoard.clearCache')} (R/К)"`
    *   **Текст:** "Очистити кеш (DEV)" (з [`src/lib/i18n/uk/gameBoard.js`](src/lib/i18n/uk/gameBoard.js))

4.  **Файл:** [`src/lib/components/Settings.svelte`](src/lib/components/Settings.svelte)
    *   **Код:** `title="{$_('settings.showMovesHint')}"`
    *   **Текст:** `showMovesHint` не знайдено в [`src/lib/i18n/uk/settings.js`](src/lib/i18n/uk/settings.js), але `showMoves` є "Показувати доступні ходи". Можливо, це застарілий ключ.
    *   **Код:** `title="{$_('settings.resetHint')}"`
    *   **Текст:** "Повернути всі налаштування до стандартних значень" (з [`src/lib/i18n/uk/settings.js`](src/lib/i18n/uk/settings.js))

5.  **Файл:** [`src/lib/components/local-setup/ColorPicker.svelte`](src/lib/components/local-setup/ColorPicker.svelte)
    *   **Код:** `title="Обрати колір"`
    *   **Текст:** "Обрати колір"
    *   **Код:** `title="Обрати {color}"`
    *   **Текст:** Динамічний, наприклад, "Обрати red"
    *   **Код:** `title="Відкрити палітру кольорів"`
    *   **Текст:** "Відкрити палітру кольорів"
    *   **Код:** `title="Обрати {color}"` (повторюється)
    *   **Текст:** Динамічний, наприклад, "Обрати blue"

## Наступні кроки

Видалити атрибут `title` з усіх перелічених елементів.