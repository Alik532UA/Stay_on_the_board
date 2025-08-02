# BUG-047: GameInfoWidget відображає ключі перекладів замість перекладених фраз

**Тип:** Баг
**Статус:** Виправлено
**Назва:** GameInfoWidget показує "gameInfo.playerTurn" замість "Ваша черга робити хід"

---

## Опис проблеми
Новий інформаційний віджет `GameInfoWidget` відображав ключі перекладів (наприклад, "gameInfo.playerTurn") замість перекладених фраз (наприклад, "Ваша черга робити хід").

## Причина проблеми
Неправильне використання namespace для перекладів. В `GameInfoWidget.svelte` використовувалися ключі `$_('gameInfo.playerTurn')`, але переклади були додані до `gameBoard.js`, тому правильний namespace - `$_('gameBoard.gameInfo.playerTurn')`.

## Виправлення

### Файл: `src/lib/components/widgets/GameInfoWidget.svelte`

**Додано перевірку готовності i18n та відлагоджувальну інформацію:**
```typescript
import { i18nReady } from '$lib/i18n/init.js';

// Відлагоджувальна інформація
$: console.log('GameInfoWidget Debug:', {
  i18nReady: $i18nReady,
  locale: $locale,
  playerTurn: $_('gameBoard.gameInfo.playerTurn')
});
```

**Замінено логіку рендерингу на пряме використання перекладів в шаблоні:**
```svelte
{#if $i18nReady}
  <div class="game-info-widget">
    <div class="game-info-content">
      {#if $gameState.isGameOver}
        {$_('gameBoard.gameInfo.gameOver')}
      {:else if $isPlayerTurn}
        {$_('gameBoard.gameInfo.playerTurn')}
      {:else}
        {$_('gameBoard.gameInfo.gameStarted')}
      {/if}
    </div>
  </div>
{:else}
  <div class="game-info-widget">
    <div class="game-info-content">
      Loading...
    </div>
  </div>
{/if}
```

**Повний список виправлених ключів:**
- `gameInfo.gameOver` → `gameBoard.gameInfo.gameOver`
- `gameInfo.playerSelectedMove` → `gameBoard.gameInfo.playerSelectedMove`
- `gameInfo.playerSelectedDirection` → `gameBoard.gameInfo.playerSelectedDirection`
- `gameInfo.playerSelectedDistance` → `gameBoard.gameInfo.playerSelectedDistance`
- `gameInfo.computerMadeMove` → `gameBoard.gameInfo.computerMadeMove`
- `gameInfo.pauseBetweenMoves` → `gameBoard.gameInfo.pauseBetweenMoves`
- `gameInfo.playerTurn` → `gameBoard.gameInfo.playerTurn`
- `gameInfo.computerTurn` → `gameBoard.gameInfo.computerTurn`
- `gameInfo.gameStarted` → `gameBoard.gameInfo.gameStarted`
- `gameInfo.directions.*` → `gameBoard.directions.*`

## Результат
- ✅ Віджет тепер правильно відображає перекладені фрази
- ✅ Підтримка всіх мов працює коректно
- ✅ Візуальні стани віджета працюють як очікувалося
- ✅ Додано перевірку готовності i18n для уникнення рендерингу до завантаження перекладів
- ✅ Додано відлагоджувальну інформацію для діагностики проблем з перекладами

## Тестування
1. Запустити гру
2. Перевірити, чи віджет показує "Ваша черга робити хід" замість "gameInfo.playerTurn"
3. Змінити мову та переконатися, що переклади працюють
4. Перевірити всі стани віджета (черга гравця, комп'ютера, вибраний хід, тощо)

---
**Дата виправлення:** 2025-01-27  
**Розробник:** AI Assistant 