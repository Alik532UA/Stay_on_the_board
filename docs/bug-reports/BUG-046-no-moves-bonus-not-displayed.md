# BUG-046: Бонус за "Ходів немає" не з'являється в модальному вікні

**Тип:** Баг
**Статус:** Виправлено
**Назва:** Бонус за "Ходів немає" не відображається в модальному вікні після правильної заяви

---

## Опис проблеми
Після правильної заяви "Ходів немає" бонус за цю заяву не відображався в модальному вікні, хоча він правильно обчислювався та додавався до загального рахунку.

## Причина проблеми
1. **Неініціалізований `noMovesBonus`**: В початковому стані гри поле `noMovesBonus` не було ініціалізовано, що призводило до `undefined` значення.
2. **Неправильна передача даних**: В GameBoard.svelte передавався весь `$gameState` як `scoreDetails`, але в Modal.svelte код очікував структуровані дані з `calculateFinalScore`.
3. **Відсутність перевірки на `undefined`**: В gameOrchestrator.ts при обчисленні `noMovesBonus` не було перевірки на `undefined` значення.

## Виправлення

### 1. Ініціалізація `noMovesBonus` в початковому стані
**Файл:** `src/lib/stores/gameState.ts`
```typescript
// Додано ініціалізацію noMovesBonus
noMovesBonus: 0,
```

### 2. Додавання перевірки на `undefined` в gameOrchestrator
**Файл:** `src/lib/gameOrchestrator.ts`
```typescript
// Замінено
noMovesBonus: state.noMovesBonus + state.boardSize
// На
noMovesBonus: (state.noMovesBonus || 0) + state.boardSize
```

### 3. Використання `calculateFinalScore` в GameBoard.svelte
**Файл:** `src/lib/components/GameBoard.svelte`
```typescript
// Додано імпорт
import { setDirection, setDistance, resetGame, calculateFinalScore } from '$lib/services/gameLogicService.js';

// Замінено передачу $gameState на calculateFinalScore
content: { reason: $t(reasonKey || ''), scoreDetails: calculateFinalScore($gameState as any) }
```

## Результат
- ✅ Бонус за "Ходів немає" тепер правильно відображається в модальному вікні
- ✅ Обчислення бонусу працює коректно навіть при повторних заявах
- ✅ Структура даних в модальному вікні стала консистентною

## Тестування
1. Зіграти гру до ситуації "Ходів немає"
2. Правильно заявити "Ходів немає"
3. Перевірити, чи бонус відображається в модальному вікні
4. Продовжити гру та повторити заяву "Ходів немає"
5. Переконатися, що бонус накопичується правильно

---
**Дата виправлення:** 2025-01-27
**Розробник:** AI Assistant 