# BUG-048: GameInfoWidget розміщується в неправильній колонці за замовчуванням

**Тип:** Баг
**Статус:** Виправлено
**Назва:** GameInfoWidget за замовчуванням у другій колонці замість першої

---

## Опис проблеми
Новий інформаційний віджет `GameInfoWidget` розміщувався в другій колонці за замовчуванням, але за вимогами повинен бути в першій колонці під дошкою гри.

## Причина проблеми
В `layoutStore.js` віджет був доданий до `column-2` замість `column-1` в масиві `defaultLayout`.

## Виправлення

### Файл: `src/lib/stores/layoutStore.js`

**Змінено розміщення віджета в макеті за замовчуванням:**
```javascript
// Було:
const defaultLayout = [
  {
    id: 'column-1',
    widgets: [WIDGETS.TOP_ROW, WIDGETS.SCORE_PANEL, WIDGETS.BOARD_WRAPPER],
  },
  {
    id: 'column-2',
    widgets: [WIDGETS.CONTROLS_PANEL, WIDGETS.GAME_INFO], // ← Тут був віджет
  },
  {
    id: 'column-3',
    widgets: [WIDGETS.SETTINGS_EXPANDER],
  },
];

// Стало:
const defaultLayout = [
  {
    id: 'column-1',
    widgets: [WIDGETS.TOP_ROW, WIDGETS.SCORE_PANEL, WIDGETS.BOARD_WRAPPER, WIDGETS.GAME_INFO], // ← Тепер тут
  },
  {
    id: 'column-2',
    widgets: [WIDGETS.CONTROLS_PANEL], // ← Видалено звідси
  },
  {
    id: 'column-3',
    widgets: [WIDGETS.SETTINGS_EXPANDER],
  },
];
```

### Файл: `docs/features/game-info-widget.md`

**Оновлено документацію:**
```markdown
### Розміщення за замовчуванням:
Віджет розміщується в першій колонці під дошкою гри.
```

## Результат
- ✅ Віджет тепер розміщується в першій колонці за замовчуванням
- ✅ Віджет знаходиться під дошкою гри, що логічно для інформаційного контенту
- ✅ Панель керування залишається в другій колонці
- ✅ Документація оновлена відповідно до змін

## Тестування
1. Запустити гру
2. Перевірити, чи віджет з'являється в першій колонці під дошкою
3. Переконатися, що панель керування залишилася в другій колонці
4. Перевірити, чи можна переміщати віджет між колонками

---
**Дата виправлення:** 2025-01-27  
**Розробник:** AI Assistant 