# Документація UI Компонентів

## Компонент Керування Грою

### Огляд
Компонент Керування Грою (`GameControlsComponent`) керує візуальними елементами керування гри, включаючи вибір напрямку, вибір відстані та підтвердження ходу.

### Основні Особливості

#### Вибір Напрямку
- **Автоматичний Вибір Відстані**: Коли напрямок вибирається вперше, автоматично вибирається відстань 1
- **Збільшення Відстані**: Коли той самий напрямок вибирається знову, відстань збільшується на 1
- **Максимальна Відстань**: Відстань не може перевищувати (розмір дошки - 1)
- **Циклічна Поведінка**: Коли досягається максимальна відстань, наступне натискання скидає відстань до 1
- **Скидання При Зміні Напрямку**: При виборі іншого напрямку відстань скидається до 1 тільки якщо вона не була вибрана вручну

#### Вибір Відстані
- **Ручний Вибір**: Коли відстань вибирається через кнопки відстані, вона позначається як вибрана вручну
- **Збереження**: Відстані, вибрані вручну, зберігаються при зміні напрямку
- **Автоматичне Скидання**: Тільки автоматично вибрані відстані скидаються при зміні напрямку

#### Центральна Кнопка Інформації
- **Формат Відображення**: Показує вибраний хід у форматі "→2" (стрілка + відстань)
- **Показ Ходу Комп'ютера**: Після ходу комп'ютера показує хід комп'ютера до початку вибору гравцем (тобто до першої дії гравця — вибору напрямку або відстані, а не до підтвердження ходу)
- **Підтвердження**: Коли вибрано і напрямок, і відстань, стає клікабельною для підтвердження ходу

#### Візуальний Фідбек
- **Підсвічування Вибору**: Вибрані кнопки напрямку та відстані візуально підсвічуються
- **Показ Ходу Комп'ютера**: Окрема область показує ходи комп'ютера в режимі vsComputer
- **Індикатори Черги Гравця**: Візуальні індикатори показують чергу поточного гравця

## Елемент Center Info

> **Детальна документація**: [CENTER_INFO_ELEMENT.md](./CENTER_INFO_ELEMENT.md)

## Показ Доступних Ходів

> **Детальна документація**: [AVAILABLE_MOVES_DISPLAY.md](./AVAILABLE_MOVES_DISPLAY.md)

### Огляд
Функціональність показу доступних ходів дозволяє гравцю бачити всі можливі ходи на дошці у вигляді білих точок. Це допомагає в стратегічному плануванні та зменшує ймовірність помилок.

### Ключові Особливості
- **Чекбокс керування**: iOS-style перемикач в налаштуваннях
- **Візуальні індикатори**: Білі точки для доступних ходів
- **Підсвічування**: Спеціальне підсвічування вибраного ходу
- **Пріоритет відображення**: Підсвічені ходи мають вищий пріоритет
- **Синхронізація**: Автоматична синхронізація між налаштуваннями та станом гри

### Поведінка
- **Вимкнено**: Білі точки не показуються
- **Увімкнено**: Білі точки показуються для всіх доступних ходів
- **Вибір ходу**: Конкретний хід підсвічується окремо

### Огляд
Елемент `center-info` - це центральна кнопка в сітці напрямків, яка відображає поточний стан вибору ходу гравця або останній хід комп'ютера. Це ключовий візуальний індикатор, який надає користувачу інформацію про поточний вибір та можливості взаємодії.

### Розташування та Структура
- **HTML ID**: `#center-info`
- **CSS Клас**: `.control-btn.center-info`
- **Розташування**: Центр сітки напрямків (позиція 5 в сітці 3x3)
- **Тип**: `<button>` елемент

### Функціональність
1. **Відображення Поточного Вибору**: Показує вибраний напрямок та/або відстань
2. **Показ Ходу Комп'ютера**: Відображає останній хід комп'ютера після його виконання
3. **Підтвердження Ходу**: Стає клікабельною кнопкою для підтвердження ходу
4. **Візуальний Фідбек**: Надає інтуїтивний фідбек про стан гри

### Стани Елемента Center Info

Елемент center-info має наступні стани, кожен зі специфічним текстом відображення, стилізацією та поведінкою:

#### 1. Початковий Стан (Пауза між ходами)
- **Відображення**: (нічого)
- **CSS Клас**: Без спеціальних класів
- **Курсор**: `default`
- **Клікабельний**: Ні
- **Стилі**: Без обводки, прозорий фон
- **Умова**: Не вибрано напрямок і відстань, немає ходу комп'ютера для показу
- **Призначення**: Пауза між ходом комп'ютера та початком вибору гравцем

#### 2. Стан Показу Ходу Комп'ютера
- **Відображення**: Останній хід комп'ютера (наприклад, `"→2"`)
- **CSS Клас**: `computer-move-display`
- **Курсор**: `default`
- **Клікабельний**: Ні
- **Стилі**: Помаранчевий фон, без обводки
- **Умова**: Не вибрано напрямок і відстань, але існує `computerLastMoveDisplay`

#### 3. Стан Тільки Напрямок
- **Відображення**: Тільки стрілка напрямку (наприклад, `"→"`, `"↑"`, `"↙"`)
- **CSS Клас**: `direction-distance-state`
- **Курсор**: `default`
- **Клікабельний**: Ні
- **Стилі**: Без обводки
- **Умова**: Вибрано напрямок, не вибрано відстань

#### 4. Стан Тільки Відстань
- **Відображення**: Тільки число відстані (наприклад, `"2"`, `"3"`)
- **CSS Клас**: `direction-distance-state`
- **Курсор**: `default`
- **Клікабельний**: Ні
- **Стилі**: Без обводки
- **Умова**: Вибрано відстань, не вибрано напрямок

#### 5. Стан Повного Ходу (Підтверджуваний)
- **Відображення**: Напрямок + Відстань (наприклад, `"→2"`, `"↑3"`, `"↙1"`)
- **CSS Клас**: `confirm-btn-active`
- **Курсор**: `pointer`
- **Клікабельний**: Так (викликає `confirmMove()`)
- **Стилі**: З обводкою (як зараз)
- **Умова**: Вибрано і напрямок, і відстань

### Мапінг Стрілок Напрямку
- **1**: `↙` (вниз-ліворуч)
- **2**: `↓` (вниз)
- **3**: `↘` (вниз-праворуч)
- **4**: `←` (ліворуч)
- **6**: `→` (праворуч)
- **7**: `↖` (вгору-ліворуч)
- **8**: `↑` (вгору)
- **9**: `↗` (вгору-праворуч)

### Методи Компонента

#### `selectDirection(direction)`
- **Призначення**: Обробляє вибір напрямку з автоматичним керуванням відстанню
- **Поведінка**:
  - Перший вибір: Встановлює напрямок і автоматично вибирає відстань 1
  - Той самий напрямок знову: Збільшує відстань на 1 (до розміру дошки - 1)
  - При максимальній відстані: Скидає відстань до 1 при наступному натисканні
  - Інший напрямок: Встановлює новий напрямок і скидає відстань до 1 тільки якщо вона не була вибрана вручну

#### `selectDistance(distance)`
- **Призначення**: Вручну вибирає конкретну відстань
- **Поведінка**: Очищає показ ходу комп'ютера, позначає відстань як вибрану вручну та оновлює стан

#### `showComputerMove(direction, distance)`
- **Призначення**: Відображає хід комп'ютера в UI
- **Поведінка**: Оновлює як показ комп'ютера, так і центральну кнопку інформації

#### `updateCenterInfo()`
- **Призначення**: Оновлює відображення центральної кнопки інформації
- **Стани**:
  - Немає вибору: Показує порожній контент
  - Тільки напрямок: Показує стрілку
  - Обидва вибрані: Показує формат "→2" і стає клікабельною
  - Хід комп'ютера: Показує останній хід комп'ютера з помаранчевим фоном

### Керування Станом
Компонент підписується на різні зміни стану гри:
- `game.selectedDirection`: Оновлює UI вибору напрямку
- `game.selectedDistance`: Оновлює UI вибору відстані
- `game.currentPlayer`: Оновлює індикатори черги гравця
- `game.gameMode`: Показує/приховує елементи, специфічні для комп'ютера

### Інтеграція
- **Інтеграція з GameLogic**: Доступ через `window.gameControlsComponent` для показу ходу комп'ютера
- **Менеджер Стану**: Використовує менеджер стану для реактивних оновлень
- **Шина Подій**: Випускає події підтвердження ходу

### Приклади Використання

```javascript
// Вибрати напрямок (автоматично вибирає відстань 1)
gameControls.selectDirection(6); // Напрямок праворуч, відстань 1

// Вибрати той самий напрямок знову (збільшує відстань)
gameControls.selectDirection(6); // Відстань стає 2

// Вибрати той самий напрямок при максимумі (скидає до 1)
gameControls.selectDirection(6); // Відстань знову стає 1

// Вручну вибрати відстань
gameControls.selectDistance(3); // Відстань 3, позначена як вибрана вручну

// Вибрати інший напрямок (зберігає відстань, вибрану вручну)
gameControls.selectDirection(4); // Напрямок ліворуч, відстань 3 (збережена)

// Показати хід комп'ютера
gameControls.showComputerMove(4, 2); // Напрямок ліворуч, відстань 2
```

### Обмеження Відстані за Розміром Дошки
- **Дошка 3x3**: Максимальна відстань = 2 (цикли: 1 → 2 → 1)
- **Дошка 4x4**: Максимальна відстань = 3 (цикли: 1 → 2 → 3 → 1)
- **Дошка 5x5**: Максимальна відстань = 4 (цикли: 1 → 2 → 3 → 4 → 1)

### CSS Стилі та Класи

#### Базові Стилі
```css
#center-info {
    border: none !important; /* Завжди без обводки */
}

/* Прозорий фон тільки для початкового стану (коли немає класів) */
#center-info:not(.confirm-btn-active):not(.computer-move-display):not(.direction-distance-state) {
    background: transparent !important;
}
```

#### CSS Класи за Станами
- `.selected`: Застосовується до вибраних кнопок напрямку/відстані
- `.confirm-btn-active`: Застосовується до center info коли хід готовий
  - **Стилі**: Зелена обводка, анімація пульсації, курсор pointer
  - **Поведінка**: Клікабельна кнопка для підтвердження ходу
- `.computer-move-display`: Застосовується до показу ходу комп'ютера
  - **Стилі**: Помаранчевий фон, без обводки
  - **Поведінка**: Тільки для відображення, не клікабельна
- `.direction-distance-state`: Застосовується до станів тільки напрямку або відстані
  - **Стилі**: Без обводки, стандартний фон
  - **Поведінка**: Тільки для відображення, не клікабельна
- `.hidden`: Приховує контроли коли не потрібні

#### Анімації
- **Пульсація**: Застосовується до `.confirm-btn-active` для привернення уваги
- **Hover ефекти**: Збільшення масштабу та зміна кольору при наведенні

### Технічна Реалізація

#### Метод `updateCenterInfo()`
Цей метод відповідає за оновлення відображення center-info елемента:

```javascript
updateCenterInfo() {
    const centerInfo = this.element.querySelector('#center-info');
    if (!centerInfo) return;
    
    // Видаляємо попередні обробники подій
    centerInfo.removeEventListener('click', this.centerInfoClickHandler);
    
    // Скидаємо всі стилі
    centerInfo.classList.remove('confirm-btn-active', 'computer-move-display', 'direction-distance-state');
    centerInfo.style.cursor = 'default';
    centerInfo.style.border = 'none';
    centerInfo.style.backgroundColor = '';
    
    // Логіка визначення стану та відображення...
}
```

#### Змінні Стану
- `this.selectedDirection`: Поточний вибраний напрямок (1-9)
- `this.selectedDistance`: Поточна вибрана відстань (1 до boardSize-1)
- `this.computerLastMoveDisplay`: Останній хід комп'ютера для відображення
- `this.distanceManuallySelected`: Флаг ручного вибору відстані

#### Обробники Подій
- **Клік**: При стані `.confirm-btn-active` викликає `confirmMove()`
- **Автоматичне оновлення**: Реагує на зміни в State Manager

### Інтеграція з Іншими Компонентами

#### GameLogic
```javascript
// Показ ходу комп'ютера
gameControlsComponent.showComputerMove(direction, distance);

// Очищення показу комп'ютера
gameControlsComponent.clearComputerMove();
```

#### State Manager
- Підписка на `game.selectedDirection`
- Підписка на `game.selectedDistance`
- Автоматичне оновлення при зміні стану

#### Event Bus
- Випуск події `game:confirmMove` при кліку на підтверджуваний стан

### Приклади Відображення

#### Початковий Стан
```html
<button id="center-info" class="control-btn center-info" type="button"></button>
```
- **Контент**: Порожній
- **Стилі**: Без обводки, стандартний фон

#### Хід Комп'ютера
```html
<button id="center-info" class="control-btn center-info computer-move-display" 
        style="background-color: orange; border: none;">→2</button>
```
- **Контент**: `"→2"` (напрямок + відстань)
- **Стилі**: Помаранчевий фон, без обводки

#### Підтверджуваний Хід
```html
<button id="center-info" class="control-btn center-info confirm-btn-active" 
        style="cursor: pointer;">→2</button>
```
- **Контент**: `"→2"` (напрямок + відстань)
- **Стилі**: Зелена обводка, анімація, курсор pointer

### Обмеження та Особливості

#### Обмеження
- Максимальна відстань обмежена розміром дошки (boardSize - 1)
- Показ комп'ютера очищається при виборі гравцем
- Тільки один стан може бути активним одночасно

#### Особливості
- Автоматичне оновлення при зміні стану гри
- Збереження ручно вибраної відстані при зміні напрямку
- Інтуїтивний візуальний фідбек для користувача 

## GameModeModal (Модальне вікно вибору режиму гри)

### Огляд
GameModeModal — це модальне вікно, яке з'являється після натискання "Гра з комп'ютером" у головному меню. Дозволяє гравцю обрати режим: звичайний або з заблокованими клітинками.

### Основні елементи
- Заголовок: "Вибір режиму гри"
- Кнопки вибору режиму (звичайний / заблоковані клітинки)
- Кнопка закриття (повернення до головного меню)

### Логіка роботи
- Відображається поверх головного меню після натискання "Гра з комп'ютером"
- Після вибору режиму — перехід до GameBoardComponent з відповідним режимом
- Якщо закрито — повернення до головного меню

### Інтеграція
- Викликається з MainMenuComponent
- Передає вибраний режим у GameBoardComponent
- Взаємодіє з навігацією (див. NAVIGATION.md) 