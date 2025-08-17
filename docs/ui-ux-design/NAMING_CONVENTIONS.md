# Правила Іменування для UI/UX Елементів

Цей документ встановлює єдині стандарти для іменування CSS-класів та атрибутів `data-testid` у проєкті. Дотримання цих правил є обов'язковим для забезпечення чистоти, читабельності та зручності підтримки кодової бази.

## 1. Іменування CSS-класів

Ми використовуємо методологію, подібну до BEM (Блок, Елемент, Модифікатор), але адаптовану для кращої інтеграції зі Svelte-компонентами.

### 1.1. Структура

Ім'я класу складається з таких частин: `[компонент]-[блок]__[елемент]--[модифікатор]`

*   **Компонент (Component):** Назва Svelte-компонента у `kebab-case`. Наприклад, `main-menu`, `settings-page`.
*   **Блок (Block):** Логічно незалежна частина інтерфейсу. Часто це сам компонент. Наприклад, `main-menu-buttons`.
*   **Елемент (Element):** Частина блоку, яка не може існувати окремо. Наприклад, `button`, `title`.
*   **Модифікатор (Modifier):** Визначає стан, зовнішній вигляд або поведінку. Наприклад, `active`, `disabled`.

### 1.2. Приклади

| HTML | Клас | Пояснення |
| :--- | :--- | :--- |
| `<div class="main-menu">...</div>` | `main-menu` | Кореневий елемент компонента `MainMenu.svelte`. |
| `<button class="main-menu__button--primary">` | `main-menu__button--primary` | Кнопка (`елемент`) в `main-menu` (`блок`) з `primary` (`модифікатор`). |
| `<div class="settings-page__option--disabled">` | `settings-page__option--disabled` | Опція (`елемент`) на сторінці налаштувань (`блок`) у вимкненому стані (`модифікатор`). |

## 2. Іменування `data-testid`

Атрибути `data-testid` використовуються для E2E-тестування і повинні бути унікальними та описовими.

### 2.1. Структура

`data-testid` формується за шаблоном: `[page-or-component]-[element-type]-[name-or-action]`

*   **Сторінка/Компонент (Page/Component):** Ідентифікатор сторінки або компонента. Наприклад, `main-menu`, `settings-page`.
*   **Тип елемента (Element Type):** Тип інтерактивного елемента. Наприклад, `button`, `checkbox`, `input`.
*   **Назва/Дія (Name/Action):** Коротка назва або дія, яку виконує елемент. Наприклад, `open-settings`, `language-uk`.

### 2.2. Приклади

| HTML | `data-testid` | Пояснення |
| :--- | :--- | :--- |
| `<button data-testid="main-menu-button-settings">` | `main-menu-button-settings` | Кнопка "settings" на головному меню. |
| `<input type="checkbox" data-testid="settings-page-checkbox-show-moves">` | `settings-page-checkbox-show-moves` | Чекбокс "show-moves" на сторінці налаштувань. |
| `<button data-testid="game-board-button-undo-move">` | `game-board-button-undo-move` | Кнопка "undo-move" на ігровій дошці. |

Дотримання цих конвенцій допоможе нам підтримувати порядок у проєкті та спростить розробку й тестування.