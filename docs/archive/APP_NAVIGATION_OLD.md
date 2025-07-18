# Навігація по застосунку "Stay on the Board"

## Загальна структура

Застосунок використовує **SPA-архітектуру** - всі екрани відображаються як компоненти в єдиному контейнері `#app`. `ViewManager` очищує контейнер і рендерить в ньому компоненти `MainMenuComponent`, `GameBoardComponent` і т.д., які замінюють один одного.

## 1. Головне меню (MainMenuComponent)

### Елементи меню
1. **Заголовок**: "Stay on the Board"
2. **Кнопки**:
   - **Гра з комп'ютером** → GameBoardComponent (з вибором розміру дошки)
   - **Локальна гра** → GameBoardComponent (з вибором розміру та імен)
   - **Онлайн гра** → OnlineMenuComponent
   - **Налаштування** → SettingsComponent
   - **Правила** → ModalComponent з правилами

### Логіка роботи
- Компонент рендериться в `#app` контейнері
- Кожна кнопка викликає `viewManager.navigateTo()` для переходу до відповідного компонента
- Стан зберігається в `stateManager`

## 2. Екран гри (GameBoardComponent)

### Елементи
1. **Верхні контроли**:
   - Кнопка "← Меню" для повернення
   - Інформація про поточного гравця
   - Рахунок
   - Контроли теми та мови
2. **Ігрова область**:
   - Дошка гри (динамічно створюється)
   - Контроли гри (кнопки, чекбокси)
3. **Випадаючий список розміру дошки** (для гри з комп'ютером)

### Логіка роботи
- Показується після вибору режиму гри з головного меню
- Розмір дошки вибирається через випадаючий список (не окремий екран)
- Ігрова логіка керується через `gameLogic` та `stateManager`
- При кліку "← Меню" повертається до `MainMenuComponent`

## 3. Меню онлайн гри (OnlineMenuComponent)

### Елементи
1. **Заголовок**: "Онлайн гра"
2. **Опис**: "Грайте з друзями онлайн!"
3. **Кнопки**:
   - **Створити кімнату** → WaitingForPlayerComponent
   - **Приєднатися до кімнати** → JoinRoomComponent
   - **Назад** → MainMenuComponent

## 4. Очікування гравця (WaitingForPlayerComponent)

### Елементи
1. **Заголовок**: "Очікуємо гравця"
2. **ID кімнати**: для передачі гравцю
3. **Кнопка копіювання ID** (📋)
4. **Повідомлення**: "Очікуємо підключення..."
5. **Кнопка "Назад"** → MainMenuComponent

### Логіка роботи
- Хост очікує підключення гостя через WebRTC
- При підключенні автоматично переходить до GameBoardComponent

## 5. Приєднання до кімнати (JoinRoomComponent)

### Елементи
1. **Заголовок**: "Приєднатися до кімнати"
2. **Поле імені**: "Ваше ім'я" (опціонально)
3. **Поле коду кімнати**: 6 символів
4. **Кнопка вставки** (📋)
5. **Кнопки**:
   - **Приєднатися** → Підключення до кімнати
   - **Назад** → OnlineMenuComponent

### Логіка роботи
- Гість вводить код кімнати
- Підключається через WebRTC
- При успішному підключенні переходить до GameBoardComponent

## 6. Налаштування (SettingsComponent)

### Елементи
1. **Заголовок**: "Налаштування"
2. **Налаштування**:
   - Вибір мови
   - Вибір теми
   - Вибір стилю
   - Озвучування ходів
   - Показ дошки
   - Показ доступних ходів
   - Режим заблокованих клітинок
3. **Кнопки**:
   - **Зберегти** → Зберігає налаштування
   - **Назад** → MainMenuComponent

## 7. Модальні вікна (ModalComponent)

### Використання
- **Правила гри**: показує правила в модальному вікні
- **Помилки**: показує повідомлення про помилки
- **Підтвердження**: запитує підтвердження дій

### Логіка роботи
- Рендериться поверх поточного компонента
- Закривається по Escape або кліку поза вікном
- Не змінює основний навігаційний стан

## Навігаційна схема

```
MainMenuComponent
├── GameBoardComponent (гра з комп'ютером)
├── GameBoardComponent (локальна гра)
├── OnlineMenuComponent
│   ├── WaitingForPlayerComponent → GameBoardComponent
│   └── JoinRoomComponent → GameBoardComponent
├── SettingsComponent
└── ModalComponent (правила)

GameBoardComponent → MainMenuComponent (кнопка "← Меню")
```

## Особливості навігації

### SPA-архітектура
- Всі екрани - компоненти в єдиному контейнері `#app`
- `ViewManager` керує переходами між компонентами
- Стан зберігається в `stateManager`

### Компонентна структура
- Кожен компонент наслідується від `BaseComponent`
- Компоненти мають методи `render()`, `attachEventListeners()`, `detachEventListeners()`
- Події передаються через `EventBus`

### Кнопка меню (← Меню)
- Завжди видима в GameBoardComponent
- Повертає до MainMenuComponent
- Зберігає поточний стан гри

### Клавіатурні скорочення
- **Escape**: закрити модальне вікно
- **Enter**: підтвердити дію
- **Tab**: навігація між елементами 