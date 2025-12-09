# Fair Scoring System (Система Справедливого Рахунку)

## Огляд

Fair Scoring - це система нарахування балів у локальній та онлайн грі, яка забезпечує справедливе визначення переможця навіть якщо гра закінчується посеред кола ходів.

## Проблема, яку вирішує Fair Scoring

### Сценарій без Fair Scoring (некоректний)
```
5 гравців, перше коло:
1. Гравець 1: хід на 2 клітини → +1 бал (бонус за відстань)
2. Гравець 2: вийшов за межі дошки → GAME OVER
```

**Некоректний результат:** Гравець 1 оголошується переможцем з 1 балом.

**Проблема:** Гравці 3, 4, 5 навіть не зробили свій перший хід! Це несправедливо.

### Сценарій з Fair Scoring (коректний)
```
5 гравців, перше коло:
1. Гравець 1: хід на 2 клітини → roundScore: +1, fixedScore: 0
2. Гравець 2: вийшов за межі дошки → GAME OVER
```

**Коректний результат:** 
- Гравець 2 програв (вийшов за межі)
- Переможців немає (у всіх fixedScore = 0, бо коло не завершилося)

## Архітектура

### Розділення рахунку

Кожен гравець має **два** типи балів:

1. **`score`** (Зафіксовані бали) - світло-блакитний колір в UI
   - Бали з **повністю завершених** кіл
   - Використовуються для визначення переможця
   - Оновлюються тільки в кінці кола

2. **`roundScore`** (Бали за поточне коло) - зелений колір в UI
   - Бали, накопичені **в поточному** колі
   - НЕ використовуються для визначення переможця
   - Скидаються на 0 після фіксації

### Формат відображення в UI

```
Гравець: 5 +2
         ↑  ↑
         │  └─ roundScore (поточне коло, зелений)
         └──── score (зафіксовані, колір за замовчуванням, тобто білі цифри в темній темі, і темні цифри в світлій темі)
```

## Технічна реалізація

### Модель даних (`Player` interface)

```typescript
interface Player {
  id: string;
  name: string;
  score: number;        // Зафіксовані бали (з повних кіл)
  roundScore?: number;  // Бали за поточне коло
  // ... інші поля
}
```

### Потік даних в LocalGameMode

#### 1. Під час ходу (`applyScoreChanges`)

```typescript
// Бали додаються до roundScore, а НЕ до score
const moveScore = bonusPoints - penaltyPoints;
playerToUpdate.roundScore = (playerToUpdate.roundScore || 0) + moveScore;
```

**Важливо:** `score` НЕ змінюється під час ходу!

#### 2. Завершення кола (`advanceToNextPlayer`)

```typescript
// Детекція завершення кола
if (nextPlayerIndex === 0) {
  this.flushRoundScores(); // Фіксація балів
}
```

#### 3. Фіксація балів (`flushRoundScores`)

```typescript
private flushRoundScores(): void {
  playerStore.update(s => {
    const newPlayers = s.players.map(p => ({
      ...p,
      score: p.score + (p.roundScore || 0),  // roundScore → score
      roundScore: 0                           // Скидання roundScore
    }));
    return { ...s, players: newPlayers };
  });
}
```

### Визначення переможця (`scoreService.ts`)

```typescript
// Використовуємо ТІЛЬКИ score (зафіксовані бали)
const maxScore = Math.max(...playerState.players.map(p => p.score));
let winners = playerState.players.filter(p => p.score === maxScore);

// Правило нічиї: якщо кілька гравців мають однаковий maxScore
if (winners.length > 1) {
  winners.length = 0; // Переможців немає
}
```

## Критичні правила

### ✅ Правило 1: Фіксація тільки в кінці кола

Бали фіксуються **ТІЛЬКИ** коли:
- Останній гравець у колі завершив свій хід
- `nextPlayerIndex === 0` (повернення до першого гравця)

### ✅ Правило 2: Переможець за зафіксованими балами

При Game Over переможець визначається **ТІЛЬКИ** за `score` (зафіксованими балами), `roundScore` **ігнорується**.

### ✅ Правило 3: Нічия = Немає переможців

Якщо кілька гравців мають однаковий `score` (наприклад, всі по 0 у першому колі), переможців немає. Є тільки той, хто програв.

### ✅ Правило 4: UI завжди показує обидва значення

UI завжди відображає `score` (зафіксовані) та `roundScore` (поточні), навіть якщо `roundScore = 0`.

## Приклади сценаріїв

### Сценарій 1: Гра закінчилася в першому колі

```
Початок:
- Всі гравці: score: 0, roundScore: 0

Хід 1 (Гравець 1): хід на 2 клітини
- Гравець 1: score: 0, roundScore: 1

Хід 2 (Гравець 2): вийшов за межі → GAME OVER

Результат:
- Гравець 2: програв
- Переможців немає (у всіх score = 0)
```

### Сценарій 2: Гра закінчилася після повного кола

```
Початок:
- Всі гравці: score: 0, roundScore: 0

Коло 1:
- Гравець 1: хід на 2 клітини → roundScore: 1
- Гравець 2: хід на 1 клітину → roundScore: 0
- Гравець 3: хід на 3 клітини → roundScore: 1
- Гравець 4: хід на 2 клітини → roundScore: 1
- Гравець 5: хід на 1 клітину → roundScore: 0

Фіксація (коло завершилося):
- Гравець 1: score: 1, roundScore: 0
- Гравець 2: score: 0, roundScore: 0
- Гравець 3: score: 1, roundScore: 0
- Гравець 4: score: 1, roundScore: 0
- Гравець 5: score: 0, roundScore: 0

Коло 2:
- Гравець 1: хід на 2 клітини → roundScore: 1
- Гравець 2: вийшов за межі → GAME OVER

Результат:
- Гравець 2: програв
- Переможці: Гравці 1, 3, 4 (всі мають score = 1)
  (Нічия! Переможців немає за правилом 3)
```

### Сценарій 3: Чіткий переможець

```
Після 2 повних кіл:
- Гравець 1: score: 3, roundScore: 0
- Гравець 2: score: 2, roundScore: 0
- Гравець 3: score: 2, roundScore: 0

Коло 3:
- Гравець 1: хід на 1 клітину → roundScore: 0
- Гравець 2: вийшов за межі → GAME OVER

Результат:
- Гравець 2: програв
- Переможець: Гравець 1 (score = 3, найбільший серед тих, хто не програв)
```

## Відмінності від Virtual-Player режиму

| Аспект | Local/Online (Fair Scoring) | Virtual-Player |
|--------|----------------------------|----------------|
| Базові бали (+1/+2/+3) | ❌ НЕ нараховуються | ✅ Нараховуються |
| Розділення score/roundScore | ✅ Так | ❌ Ні |
| Визначення переможця | За `score` (зафіксовані) | За загальним рахунком |
| Нічия | Переможців немає | Можливі кілька переможців |

## Технічні деталі реалізації

### Передача actualGameMode

**Проблема:** `settings.gameMode` містить **пресет** ('observer', 'beginner'), а не фактичний режим гри.

**Рішення:** `BaseGameMode.handlePlayerMove` передає `this.getModeName()` в `performMove`:

```typescript
// BaseGameMode.ts
const moveResult = gameLogicService.performMove(
  direction, 
  distance, 
  playerState!.currentPlayerIndex, 
  combinedState, 
  settings, 
  this.getModeName(), // actualGameMode: 'local' | 'virtual-player' | ...
  onEndCallback
);
```

### Логіка нарахування базових балів

```typescript
// gameLogicService.ts - performMove
const isLocalOrOnlineGame = actualGameMode === 'local' || actualGameMode === 'online';
const shouldApplyBaseScore = !isLocalOrOnlineGame;
const baseScoreToAdd = shouldApplyBaseScore ? scoreChanges.baseScoreChange : 0;

// Додаємо до score тільки якщо НЕ локальна/онлайн гра
players: currentState.players.map((p, i) => 
  i === playerIndex ? { ...p, score: p.score + baseScoreToAdd } : p
)
```

## Діагностика та логування

### Важливі логи для Fair Scoring

```javascript
// logService.js - увімкнути для діагностики
logConfig: {
  SCORE: true,  // Логи нарахування балів
  GAME_MODE: true  // Логи режиму гри
}
```

### Ключові лог-повідомлення

```
[SCORE] [LocalGameMode] applyScoreChanges for <Name>:
  - bonusPointsFromMove: X
  - penaltyPointsFromMove: Y
  - moveScore: Z
  - newRoundScore: N
  - fixedScore: M

[GAME_MODE] [LocalGameMode] Round completed. Flushing round scores to fixed scores.

[SCORE] Flushed round scores. New fixed scores: [...]

[SCORE] [performMove] Score calculation:
  - actualGameMode: 'local'
  - presetGameMode: 'observer'
  - baseScoreToAdd: 0
```

## Можливі проблеми та їх вирішення

### Проблема 1: Базові бали нараховуються в локальній грі

**Симптом:** Гравець отримує +1/+2/+3 за звичайний хід в локальній грі.

**Діагностика:** Перевірте лог `[performMove] Score calculation`:
```
actualGameMode: 'local'
baseScoreToAdd: 0  // Має бути 0!
```

**Причина:** `actualGameMode` не передається або має неправильне значення.

**Рішення:** Переконайтеся, що `BaseGameMode.handlePlayerMove` передає `this.getModeName()`.

### Проблема 2: roundScore не скидається

**Симптом:** `roundScore` продовжує накопичуватися через кілька кіл.

**Діагностика:** Перевірте лог `Round completed. Flushing round scores`.

**Причина:** `flushRoundScores()` не викликається або не скидає `roundScore`.

**Рішення:** Перевірте умову `if (nextPlayerIndex === 0)` в `advanceToNextPlayer`.

### Проблема 3: Переможець визначається некоректно

**Симптом:** Переможець визначається за `roundScore` замість `score`.

**Діагностика:** Перевірте `scoreService.determineWinner` - використовується `p.score`, а не `p.roundScore`.

**Рішення:** Переконайтеся, що `determineWinner` використовує тільки `player.score`.

## Майбутні розширення

### Online Game Mode

Fair Scoring вже підготовлено для онлайн-режиму:
- `OnlineGameMode.ts` містить заглушки для `roundScore`
- Потрібна синхронізація стану через WebSocket/API
- Фіксація балів має відбуватися синхронно для всіх клієнтів

### Додаткові метрики

Можливі розширення:
- Статистика по колах (середній `roundScore` за коло)
- Історія фіксацій балів
- Графіки прогресу гравців по колах
