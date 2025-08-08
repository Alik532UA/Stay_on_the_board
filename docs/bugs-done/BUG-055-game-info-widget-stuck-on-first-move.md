---
status: done
---

# BUG-055: GameInfoWidget застряг на повідомленні firstMove

## Опис проблеми

**Актуальний результат:** 
1. Постійно написано `gameBoard.gameInfo.firstMove`, повідомлення не міняються
2. Після виправлення: анімація працює для першого переходу, але потім зупиняється
3. Після другого виправлення: третє повідомлення не з'являється
4. **Діагностика показала:** Проміжні зміни стану під час анімації не відстежуються
5. **Додаткова діагностика показала:** Логіка визначення стану не правильно розрізняє стани після ходу гравця
6. **Фінальна діагностика показала:** Стан `'computerMove'` не змінюється при оновленні `lastComputerMove`, тому анімація не запускається

**Очікуваний результат:** Повідомлення міняються через анімацію fade, тобто плавно зникає минуле повідомлення і плавно з'являється нове (але не впливає на логіку та на center-info)

## Причина проблеми

У логіці анімації в `GameInfoWidget.svelte` була помилка:

1. **Проблема з ініціалізацією:** Коли `previousState` порожній (при першому рендері), умова `currentState !== previousState && previousState !== ''` не виконувалася, тому `displayMessage` не оновлювався.

2. **Проблема з оновленням:** `displayMessage` встановлювався тільки один раз при ініціалізації, а потім не оновлювався при зміні стану.

3. **Неправильна логіка анімації:** Реактивна декларація не правильно відстежувала зміни стану.

4. **Проблема з previousState:** `previousState = currentState` встановлювався **до** завершення анімації, що блокувало подальші оновлення.

5. **Потенційна проблема з визначенням стану:** Можливо, логіка визначення `currentState` не розрізняє всі можливі стани правильно.

6. **Критична проблема з проміжними змінами:** Під час анімації (коли `isAnimating = true`) нові зміни стану ігнорувалися, тому що умова `!isAnimating` блокувала їх обробку.

7. **Проблема з логікою визначення стану:** Після ходу гравця стан не змінювався на `'playerTurn'`, а залишався `'computerMove'` або `'pause'`, що блокувало подальші оновлення.

8. **Критична проблема з оновленням ходів комп'ютера:** Коли `lastComputerMove` змінювався (наприклад, з `{direction: 'left', distance: 1}` на `{direction: 'down', distance: 2}`), стан залишався `'computerMove'`, тому анімація не запускалася для оновлення повідомлення.

## Виправлення

### Зміни в `src/lib/components/widgets/GameInfoWidget.svelte`

1. **Додано змінну `isInitialized`:**
   ```typescript
   let isInitialized = false;
   ```

2. **Додано змінну `pendingState` для відстеження очікуваного стану:**
   ```typescript
   let pendingState = ''; // Додаємо відстеження очікуваного стану
   ```

3. **Переписано логіку визначення `currentState` з урахуванням змін в `lastComputerMove`:**
   ```typescript
   // Визначаємо поточний стан з урахуванням змін в lastComputerMove
   $: currentState = (() => {
     if ($gameState.isGameOver) return 'gameOver';
     if ($gameState.isFirstMove) return 'firstMove';
     if ($gameState.wasResumed) return 'wasResumed';
     
     // Якщо є хід комп'ютера і не пауза - показуємо хід комп'ютера
     if ($lastComputerMove && !$isPauseBetweenMoves) {
       // Додаємо хеш ходу комп'ютера до стану, щоб відстежувати зміни
       const moveHash = `${$lastComputerMove.direction}-${$lastComputerMove.distance}`;
       return `computerMove-${moveHash}`;
     }
     
     // Якщо пауза між ходами - показуємо паузу
     if ($isPauseBetweenMoves) return 'pause';
     
     // Якщо черга гравця і немає останнього ходу комп'ютера - черга гравця
     if ($isPlayerTurn && !$lastComputerMove) return 'playerTurn';
     
     // Якщо черга комп'ютера - черга комп'ютера
     if (!$isPlayerTurn) return 'computerTurn';
     
     // За замовчуванням - черга гравця
     return 'playerTurn';
   })();
   ```

4. **Оновлено функцію `getMessageForState` для обробки нового формату стану:**
   ```typescript
   } else if (currentState.startsWith('computerMove-') && $lastComputerMove && !$isPauseBetweenMoves) {
     const message = $_('gameBoard.gameInfo.computerMadeMove', { 
       values: { 
         direction: $lastComputerMove.direction === 'up-left' ? $_('gameBoard.directions.upLeft') :
                   $lastComputerMove.direction === 'up' ? $_('gameBoard.directions.up') :
                   $lastComputerMove.direction === 'up-right' ? $_('gameBoard.directions.upRight') :
                   $lastComputerMove.direction === 'left' ? $_('gameBoard.directions.left') :
                   $lastComputerMove.direction === 'right' ? $_('gameBoard.directions.right') :
                   $lastComputerMove.direction === 'down-left' ? $_('gameBoard.directions.downLeft') :
                   $lastComputerMove.direction === 'down' ? $_('gameBoard.directions.down') :
                   $lastComputerMove.direction === 'down-right' ? $_('gameBoard.directions.downRight') :
                   $lastComputerMove.direction,
         distance: $lastComputerMove.distance 
       } 
     });
     console.log('Returning computerMadeMove message:', message);
     return message;
   ```

5. **Переписано логіку ініціалізації та оновлення:**
   ```typescript
   // Ініціалізація та оновлення повідомлення
   $: if ($i18nReady && currentState) {
     if (!isInitialized) {
       // Перший рендер - встановлюємо повідомлення без анімації
       displayMessage = getMessageForState();
       isInitialized = true;
       previousState = currentState;
     } else if (currentState !== previousState && !isAnimating) {
       // Зміна стану - запускаємо анімацію
       isAnimating = true;
       pendingState = currentState; // Запам'ятовуємо очікуваний стан
       
       // Після fade-out змінюємо повідомлення і робимо fade-in
       setTimeout(() => {
         displayMessage = getMessageForState();
         setTimeout(() => {
           isAnimating = false;
           // Оновлюємо previousState тільки після завершення анімації
           previousState = pendingState;
           pendingState = '';
         }, 300); // fade-in
       }, 300); // fade-out
     } else if (currentState !== previousState && isAnimating && currentState !== pendingState) {
       // Якщо під час анімації стан змінився знову, оновлюємо pendingState
       pendingState = currentState;
     }
   }
   ```

6. **Видалено стару логіку:**
   - Видалено умову `currentState !== previousState && previousState !== ''`
   - Видалено окрему реактивну декларацію для `previousState`
   - Видалено окрему умову для ініціалізації `displayMessage`

7. **Ключові виправлення:**
   - Додано перевірку `!isAnimating` в умову зміни стану
   - Перенесено `previousState = currentState` в кінець анімації
   - Додано відстеження `pendingState` для проміжних змін
   - Додано обробку змін стану під час анімації
   - Виправлено логіку визначення стану для правильного розрізнення `'playerTurn'`
   - **Додано хеш ходу комп'ютера до стану** для відстеження змін в `lastComputerMove`

8. **Діагностичні покращення:**
   - Спрощено логіку визначення `currentState` з використанням IIFE
   - Додано детальну відлагоджувальну інформацію для всіх ключових змінних
   - Додано логування в `getMessageForState` для відстеження вибору повідомлень
   - Додано додаткову діагностику для випадків, коли стан не змінюється
   - Додано `lastComputerMoveHash` для відстеження змін в ходах комп'ютера

## Діагностика

Додано детальне логування для відстеження:
- Зміни `currentState`, `previousState` та `pendingState`
- Стану анімації (`isAnimating`)
- Викликів `getMessageForState` та повернених повідомлень
- Всіх залежних станів (`gameState`, `derivedState`)
- Проміжних змін стану під час анімації
- Випадків, коли стан не змінюється
- **Змін в `lastComputerMove` через `lastComputerMoveHash`**

## Результат

✅ **Виправлено:** GameInfoWidget тепер правильно ініціалізується та оновлює повідомлення при зміні стану гри

✅ **Збережено:** Анімація fade-out/fade-in працює коректно для всіх переходів

✅ **Збережено:** Логіка не впливає на center-info або інші компоненти

✅ **Виправлено:** Повідомлення оновлюються протягом всієї гри, а не тільки для першого переходу

✅ **Виправлено:** Проміжні зміни стану під час анімації тепер правильно відстежуються

✅ **Виправлено:** Логіка визначення стану правильно розрізняє всі можливі стани гри

✅ **Виправлено:** Повідомлення оновлюється при зміні ходу комп'ютера (наприклад, з "вліво на 1" на "вниз на 2")

## Тестування

1. Запустити гру
2. Відкрити консоль браузера для перегляду логів
3. Перевірити, що початкове повідомлення відображається правильно
4. Зробити хід і перевірити, що повідомлення змінюється з анімацією
5. Перевірити, що всі наступні зміни стану також викликають анімацію
6. Перевірити всі стани гри (хід комп'ютера, пауза, продовження тощо)
7. Перевірити, що проміжні зміни стану під час анімації обробляються правильно
8. Перевірити, що після ходу гравця повідомлення змінюється на "Ваша черга робити хід"
9. **Перевірити, що при зміні ходу комп'ютера повідомлення оновлюється з анімацією**

## Файли

- `src/lib/components/widgets/GameInfoWidget.svelte` - виправлена логіка анімації та ініціалізації з відстеженням проміжних змін, покращеною логікою визначення стану та підтримкою оновлення ходів комп'ютера 