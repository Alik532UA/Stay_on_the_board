---
id: BUG-059
title: Виправлення проблеми з поверненням до модального вікна після replay
status: done
---

### Опис

Після виходу з replay не відновлювалося попереднє модальне вікно "Суперник у пастці!". Замість цього запускалася нова гра.

### Кроки для відтворення

1. Застати комп'ютера в пастці (вікно "Суперник у пастці!")
2. Натиснути "Переглянути запис"
3. Вийти з replay
4. Актуальний результат: нова гра
5. Очікуваний результат: вікно "Суперник у пастці!"

### Причина проблеми

Модальне вікно "Суперник у пастці!" створювалося безпосередньо через `modalStore.showModal()`, а не через `endGame()`. Це означало, що `isGameOver` не встановлювалося в `true`, і `_getCurrentModalContext()` повертало `null`.

### Виправлення

1. **Додано встановлення стану гри** в `gameOrchestrator.ts`:
   ```typescript
   await stateManager.applyChanges(
     'SET_GAME_OVER_FOR_MODAL', 
     { 
       isGameOver: true,
       gameOverReasonKey: 'modal.computerNoMovesContent',
       gameOverReasonValues: null
     }, 
     'Setting game over state for computer no moves modal'
   );
   ```

2. **Оновлено метод `continueAfterNoMoves`** для скидання стану завершення гри:
   ```typescript
   isGameOver: false,
   gameOverReasonKey: null as string | null,
   gameOverReasonValues: null as Record<string, any> | null
   ```

3. **Додано логування** для діагностики в `_getCurrentModalContext` та `FloatingBackButton`

### Результат

Тепер після виходу з replay правильно відновлюється попереднє модальне вікно "Суперник у пастці!" замість запуску нової гри.

### Технічні деталі

- **Проблема:** Модальне вікно не встановлювало `isGameOver: true`
- **Рішення:** Додано встановлення стану завершення гри перед показом модального вікна
- **Вплив:** Правильне відновлення контексту модального вікна після replay 