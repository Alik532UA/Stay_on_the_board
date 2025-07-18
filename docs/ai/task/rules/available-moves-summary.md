# Зведення Правил: Показ Доступних Ходів

## Проблема та Рішення

### Початкова Проблема
Чекбокс "Показувати доступні ходи" працював навпаки:
- Показував білі точки коли був **вимкнений**
- Не показував білі точки коли був **увімкнений**

### Виправлення
Виправлено логіку в `GameBoardComponent.renderBoard()`:
- Додано перевірку `showingAvailableMoves` для відображення доступних ходів
- Встановлено правильний пріоритет відображення

## Правила Логіки

### 1. Стани Чекбокса
- **Вимкнено** (`showMoves: false`): Білі точки **НЕ** показуються
- **Увімкнено** (`showMoves: true`): Білі точки **показуються** для всіх доступних ходів

### 2. Пріоритет Відображення
1. **Підсвічені ходи** (найвищий пріоритет)
   - Показуються коли вибрано конкретний напрямок і відстань
   - Замінюють звичайні білі точки для цього ходу
2. **Доступні ходи** (нижчий пріоритет)
   - Показуються коли чекбокс увімкнено
   - Не показуються для підсвічених ходів

### 3. Візуальні Елементи
- **Білі точки**: `●` для доступних ходів
- **Підсвічені ходи**: `●` з додатковим стилем
- **Розмір**: `calc(var(--cell-size) * 0.33)`
- **Колір**: `var(--text-accent)` (білий)

## Технічна Реалізація

### StateManager Стани
```javascript
settings: {
  showMoves: boolean // Чи показувати доступні ходи
}

game: {
  availableMoves: Array<Move>, // Всі доступні ходи
  highlightedMoves: Array<Move>, // Підсвічені ходи (тільки вибраний)
  showingAvailableMoves: boolean // Синхронізовано з settings.showMoves
}
```

### Ключові Функції
- `toggleAvailableMoves(show)` - перемикає показ доступних ходів
- `updateAvailableMoves()` - оновлює список доступних ходів та підсвічування
- `renderBoard()` - відображає білі точки на дошці

### Логіка Рендерингу
```javascript
if (isHighlighted) {
  // Показує підсвічений хід
  cell.classList.add('highlighted-move');
  cell.innerHTML = '<span class="move-dot move-dot-highlighted"></span>';
} else if (isAvailable && showingAvailableMoves) {
  // Показує доступний хід
  cell.classList.add('available-move');
  cell.innerHTML = '<span class="move-dot"></span>';
}
```

## UI/UX Правила

### 1. Чекбокс в Налаштуваннях
- **Розташування**: Налаштування → Ігровий процес
- **Тип**: iOS-style перемикач
- **За замовчуванням**: `true` (увімкнено)
- **Збереження**: В `settings.showMoves`

### 2. Поведінка в Різних Режимах
- **Гра з комп'ютером**: За замовчуванням увімкнено
- **Локальна гра**: Значення з налаштувань
- **Онлайн гра**: Значення з налаштувань

### 3. Взаємодія з Іншими Функціями
- **Режим заблокованих клітинок**: Доступні ходи враховують заблоковані клітинки
- **Зміна розміру дошки**: Доступні ходи перераховуються
- **Голосове керування**: Команди "показати ходи" / "сховати ходи"

## Правила Синхронізації

### 1. Між Компонентами
- `SettingsComponent` → `GameLogic` → `GameBoardComponent`
- Автоматична синхронізація при зміні налаштувань
- Оновлення UI при зміні стану гри

### 2. Між Станами
- `settings.showMoves` ↔ `game.showingAvailableMoves`
- `game.availableMoves` → `game.highlightedMoves` (при виборі)
- Оновлення при зміні позиції фігури

## Правила Тестування

### 1. Базові Сценарії
- ✅ Вимкнений чекбокс: Білі точки не показуються
- ✅ Увімкнений чекбокс: Білі точки показуються
- ✅ Вибір напрямку: Підсвічування ходів у напрямку
- ✅ Вибір відстані: Підсвічування ходів з відстанню
- ✅ Повний вибір: Підсвічування конкретного ходу

### 2. Критичні Шляхи
- Синхронізація між налаштуваннями та станом гри
- Правильний пріоритет відображення
- Оновлення при зміні стану гри
- Збереження налаштувань між сесіями

## Правила Логування

### 1. Ключові Події
- `toggleAvailableMoves called, show = {show}`
- `updateAvailableMoves - showingAvailableMoves: {showingAvailableMoves, movesCount}`
- `renderBoard - moves state: {availableMovesCount, highlightedMovesCount, showingAvailableMoves}`

### 2. Діагностика
- Відстеження кількості доступних та підсвічених ходів
- Моніторинг стану чекбокса
- Перевірка синхронізації між налаштуваннями та станом гри

## Правила Продуктивності

### 1. Оптимізації
- Перерахунок доступних ходів тільки при зміні позиції
- Візуальне оновлення тільки при зміні налаштувань
- Кешування доступних ходів

### 2. Обмеження
- Перерахунок при кожній зміні стану гри
- Візуальне оновлення всіх клітинок при зміні налаштувань

## Майбутні Покращення

### 1. Заплановані Функції
- Різні кольори для різних типів ходів
- Тимчасове приховування під час аналізу
- Анімація появи/зникнення точок
- Налаштування прозорості точок

### 2. UX Покращення
- Тимчасове приховування під час гри
- Різні типи індикаторів для різних типів ходів
- Контекстні підказки

## Висновок

Виправлення забезпечує правильну роботу чекбокса "Показувати доступні ходи":
- ✅ Вимкнений = білі точки не показуються
- ✅ Увімкнений = білі точки показуються
- ✅ Правильний пріоритет відображення
- ✅ Синхронізація між компонентами
- ✅ Збереження налаштувань

Всі правила задокументовані та готові для майбутнього розвитку функціональності. 