# Аудит поточної архітектури (перед міграцією на Svelte)

## Структура проєкту

- **HTML:**
  - `index-js.html`, `index-svelte.html`, `index-old-architecture.html` — різні версії стартових сторінок.
- **JS:**
  - Основна логіка у папці `js/`
    - `components/` — всі основні UI-компоненти (main-menu, game-board, controls, modals, settings, online-menu, тощо)
    - `view-manager.js` — централізований менеджер відображення компонентів
    - `state-manager.js` — централізований менеджер стану (аналог Svelte store)
    - `game-logic-new.js`, `game-core.js` — ігрова логіка
    - `event-bus.js` — система подій
    - `localization.js`, `lang/` — локалізація
    - `utils/` — утиліти (логування, кешування, аналітика, валідація)
- **CSS:**
  - `css/main.css` — головний файл стилів
  - `css/components/`, `css/layouts/`, `css/themes/`, `css/base/` — модульні стилі для різних частин UI

## Основні UI-компоненти

- MainMenuComponent
- GameBoardComponent
- GameControlsComponent
- ModalComponent
- OnlineMenuComponent
- SettingsComponent
- WaitingForPlayerComponent
- JoinRoomComponent
- LocalGameComponent

## Основні сторінки/екрани

- Головне меню
- Ігрова дошка
- Меню онлайн-режиму
- Налаштування
- Модальні вікна

## Модулі логіки

- `game-logic-new.js` — основна ігрова логіка
- `state-manager.js` — управління станом
- `event-bus.js` — події
- `logger.js` — логування
- `localization.js` — локалізація

## Маршрутизація

- Реалізована через stateManager та ViewManager (зміна `ui.currentView` → рендер відповідного компонента)
- Всі переходи між екранами централізовані

## Сторонні бібліотеки

- В основному Vanilla JS, залежності мінімальні (можливо, лише dev-залежності для тестування/збірки)

## Особливості

- **Логування:** централізована система логування (`logger.js`)
- **Локалізація:** підтримка 4 мов, окремі файли для кожної мови
- **Темізація:** CSS custom properties, кілька тем у `css/themes/`
- **Тестування:** є unit-тести для основних модулів 