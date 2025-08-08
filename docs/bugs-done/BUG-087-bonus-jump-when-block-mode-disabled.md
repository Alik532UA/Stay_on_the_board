---
status: done
---

# BUG-087: Бонуси за перестрибування нараховуються навіть коли "Режим заблокованих клітинок" вимкнений

## Опис проблеми

Бонуси за перестрибування заблокованих клітинок нараховувалися навіть коли налаштування `blockModeEnabled` було встановлено в `false`. Це призводило до неправильного нарахування балів у грі.

## Симптоми

- Бонуси за перестрибування нараховувалися незалежно від стану `blockModeEnabled`
- У лозі гри з'являлися записи типу: `додаємо 1 бонусних балів за перестрибування 1 заблокованих клітинок` навіть коли режим блокування був вимкнений
- Фінальний рахунок міг містити бонуси за перестрибування, які не повинні були нараховуватися

## Причина

Функція `countJumpedCells` не перевіряла налаштування `blockModeEnabled` і завжди рахувала клітинки, які відвідані більше разів, ніж `blockOnVisitCount`, як "заблоковані".

Код в `calculateMoveScore` також не перевіряв `blockModeEnabled` перед нарахуванням бонусів за перестрибування:

```typescript
// 6. Підрахунок бонусних балів за перестрибування заблокованих клітинок
if (jumpedCount > 0) { // ← НЕ перевірявся blockModeEnabled!
  newBonusPoints += jumpedCount;
}
```

## Рішення

### 1. Оновлено функцію `countJumpedCells`

Додано параметр `blockModeEnabled` та перевірку:

```typescript
export function countJumpedCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cellVisitCounts: Record<string, number>,
  blockOnVisitCount: number,
  blockModeEnabled: boolean = false
): number {
  // Якщо режим блокування вимкнений, не рахуємо перестрибнуті клітинки
  if (!blockModeEnabled) {
    return 0;
  }
  
  // ... існуюча логіка ...
}
```

### 2. Оновлено логіку нарахування бонусів

Додано перевірку `blockModeEnabled` в `calculateMoveScore`:

```typescript
// 6. Підрахунок бонусних балів за перестрибування заблокованих клітинок
// Бонуси за перестрибування нараховуються тільки коли blockModeEnabled = true
if (jumpedCount > 0 && settings.blockModeEnabled) {
  newBonusPoints += jumpedCount;
  console.log(`🎯 calculateMoveScore: додаємо ${jumpedCount} бонусних балів за перестрибування ${jumpedCount} заблокованих клітинок`);
} else if (jumpedCount > 0 && !settings.blockModeEnabled) {
  console.log(`🎯 calculateMoveScore: пропускаємо бонуси за перестрибування (blockModeEnabled = false)`);
}
```

### 3. Оновлено виклик функції

Передається параметр `blockModeEnabled`:

```typescript
const jumpedCount = countJumpedCells(
  currentState.playerRow,
  currentState.playerCol,
  newPosition.row,
  newPosition.col,
  currentState.cellVisitCounts,
  settings.blockOnVisitCount,
  settings.blockModeEnabled // ← Додано цей параметр
);
```

## Тестування

### Сценарій 1: blockModeEnabled = false
- **Очікуваний результат**: Бонуси за перестрибування не нараховуються
- **Лог**: `пропускаємо бонуси за перестрибування (blockModeEnabled = false)`
- **Фінальний рахунок**: Не містить бонусів за перестрибування

### Сценарій 2: blockModeEnabled = true
- **Очікуваний результат**: Бонуси за перестрибування нараховуються нормально
- **Лог**: `додаємо X бонусних балів за перестрибування X заблокованих клітинок`
- **Фінальний рахунок**: Містить бонуси за перестрибування

## Документація

Оновлено документацію в `docs/logic/BONUS_SCORING.md`:

- Додано умову про `blockModeEnabled` для бонусів за перестрибування
- Оновлено приклади розрахунків
- Додано приклади для випадків з увімкненим та вимкненим режимом блокування

## Файли, що були змінені

- `src/lib/services/gameLogicService.ts` - основна логіка виправлення
- `docs/logic/BONUS_SCORING.md` - оновлення документації

## Статус

✅ **ВИРІШЕНО**: Бонуси за перестрибування тепер нараховуються тільки коли `blockModeEnabled = true` 