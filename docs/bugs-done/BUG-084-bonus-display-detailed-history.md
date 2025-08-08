---
status: done
---

# BUG-084: Детальна історія бонусних балів для кожного гравця

## Опис проблеми

При натисканні на `bonus-display` показувалася загальна інформація про бонусні бали, а не конкретна інформація про те, скільки бонусних балів отримав цей конкретний гравець і за які дії.

### Актуальний результат
- При натисканні на `bonus-display` показувалася загальна інформація про бонусні бали
- Не було можливості побачити детальну історію бонусних балів конкретного гравця

### Очікуваний результат
- При натисканні на `bonus-display` показується детальна історія бонусних балів конкретного гравця
- Включає інформацію про кожен випадок нарахування бонусних балів з причиною та часом
- Показує загальну суму бонусних балів гравця

## Аналіз проблеми

### Причина
В `localGameStore` зберігалася тільки загальна кількість бонусних балів для кожного гравця, але не було історії того, за які саме дії ці бали були нараховані.

### Необхідні зміни
1. Додати поле `bonusHistory` до структури гравця
2. Оновити метод `addPlayerBonusPoints` для збереження історії
3. Створити функцію для показу детальної інформації про бонусні бали конкретного гравця

## Рішення

### 1. Оновлення структури гравця в `localGameStore.js`

Додано поле `bonusHistory` до структури гравця:

```javascript
// Початковий стан
const createInitialState = () => {
  return {
    players: [
      { id: generateId(), name: 'Гравець 1', color: player1Color, score: 0, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: generateId(), name: 'Гравець 2', color: player2Color, score: 0, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: generateId(), name: 'Гравець 3', color: player3Color, score: 0, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] },
      { id: generateId(), name: 'Гравець 4', color: player4Color, score: 0, penaltyPoints: 0, bonusPoints: 0, bonusHistory: [] }
    ],
    // ...
  };
};
```

### 2. Оновлення методу `addPlayerBonusPoints`

Додано параметр `reason` та збереження історії:

```javascript
addPlayerBonusPoints: (playerId, bonusPointsToAdd, reason = '') => {
  console.log(`🎯 localGameStore.addPlayerBonusPoints: додаємо ${bonusPointsToAdd} бонусних балів гравцю з ID ${playerId} за: ${reason}`);
  update(state => {
    const updatedState = {
      ...state,
      players: state.players.map(p => 
        p.id === playerId ? { 
          ...p, 
          bonusPoints: p.bonusPoints + bonusPointsToAdd,
          bonusHistory: [...p.bonusHistory, {
            points: bonusPointsToAdd,
            reason: reason,
            timestamp: Date.now()
          }]
        } : p
      )
    };
    // ...
    return updatedState;
  });
}
```

### 3. Оновлення викликів в `gameLogicService.ts`

Додано формування детального опису причини нарахування бонусних балів:

```typescript
// Формуємо детальний опис бонусних балів
let bonusReason = '';
if (distance > 1 && scoreChanges.jumpedBlockedCells > 0) {
  bonusReason = `хід на відстань ${distance} (1 бал) + перестрибування ${scoreChanges.jumpedBlockedCells} заблокованих клітинок (${scoreChanges.jumpedBlockedCells} балів)`;
} else if (distance > 1) {
  bonusReason = `хід на відстань ${distance} (1 бал)`;
} else if (scoreChanges.jumpedBlockedCells > 0) {
  bonusReason = `перестрибування ${scoreChanges.jumpedBlockedCells} заблокованих клітинок (${scoreChanges.jumpedBlockedCells} балів)`;
}

localGameStore.addPlayerBonusPoints(localPlayer.id, scoreChanges.bonusPoints, bonusReason);
```

### 4. Створення функції `showPlayerBonusInfo` в `ScorePanelWidget.svelte`

Додано функцію для показу детальної інформації про бонусні бали конкретного гравця:

```javascript
function showPlayerBonusInfo(player) {
  if (player.bonusHistory && player.bonusHistory.length > 0) {
    // Формуємо детальний опис бонусних балів гравця
    let bonusDetails = `Бонусні бали гравця ${player.name}:\n\n`;
    
    player.bonusHistory.forEach((bonus, index) => {
      const time = new Date(bonus.timestamp).toLocaleTimeString();
      bonusDetails += `${index + 1}. +${bonus.points} балів - ${bonus.reason} (${time})\n`;
    });
    
    bonusDetails += `\nЗагальна сума бонусних балів: ${player.bonusPoints}`;
    
    modalStore.showModal({
      titleKey: 'gameBoard.bonusInfoTitle',
      content: bonusDetails,
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  } else {
    // Якщо немає бонусних балів, показуємо загальну інформацію
    modalStore.showModal({
      titleKey: 'gameBoard.bonusInfoTitle',
      contentKey: 'gameBoard.bonusHint',
      buttons: [{ textKey: 'modal.ok', primary: true, isHot: true }]
    });
  }
}
```

### 5. Оновлення кліку на `bonus-display`

Змінено обробник кліку для показу детальної інформації конкретного гравця:

```svelte
<span 
  class="bonus-display" 
  on:click={() => showPlayerBonusInfo(player)}
  on:keydown={e => (e.key === 'Enter' || e.key === ' ') && showPlayerBonusInfo(player)}
  title="Натисніть для перегляду деталей бонусних балів"
  role="button"
  tabindex="0"
>+{player.bonusPoints}</span>
```

## Результат

Тепер при натисканні на `bonus-display` користувач бачить:

### Детальна інформація включає:
1. **Заголовок**: "Бонусні бали гравця [Ім'я]"
2. **Список бонусних балів**: кожен випадок з причиною та часом
3. **Загальну суму**: загальна кількість бонусних балів гравця

### Приклад відображення:
```
Бонусні бали гравця Гравець 1:

1. +1 балів - хід на відстань 2 (1 бал) (14:25:30)
2. +2 балів - хід на відстань 3 (1 бал) + перестрибування 1 заблокованих клітинок (1 балів) (14:26:15)
3. +1 балів - перестрибування 1 заблокованих клітинок (1 балів) (14:27:45)

Загальна сума бонусних балів: 4
```

## Файли, що були змінені

- `src/lib/stores/localGameStore.js` - додано поле `bonusHistory` та оновлено метод `addPlayerBonusPoints`
- `src/lib/services/gameLogicService.ts` - оновлено виклики `addPlayerBonusPoints` з детальним описом причин
- `src/lib/components/widgets/ScorePanelWidget.svelte` - додано функцію `showPlayerBonusInfo` та оновлено обробники кліків

## Тестування

Виправлення протестовано:
- ✅ При натисканні на `bonus-display` показується детальна історія бонусних балів конкретного гравця
- ✅ Історія включає причину нарахування кожного бонусного балу
- ✅ Показується час нарахування кожного бонусного балу
- ✅ Відображається загальна сума бонусних балів гравця
- ✅ Якщо немає бонусних балів, показується загальна інформація

## Статус

✅ **ВИПРАВЛЕНО** - 2025-01-30 