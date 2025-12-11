# User Guide - Документація користувача

## Навігація по документації

### Система балів та рахунку

1. **[bonus-scoring.md](bonus-scoring.md)** - Повна система нарахування балів
   - Базові бали за ходи
   - Бонусні бали (відстань, перестрибування, розмір дошки, режим блокування)
   - Штрафні бали
   - Відмінності між режимами гри

2. **[fair-scoring.md](fair-scoring.md)** ⭐ **НОВИЙ** - Система Fair Scoring для локальної/онлайн гри
   - Розділення на зафіксовані бали та бали за поточне коло
   - Справедливе визначення переможця
   - Технічна реалізація (`score` vs `roundScore`)
   - Діагностика та вирішення проблем
   - **Читайте це, якщо:**
     - Не розумієте, чому переможець визначається саме так
     - Потрібно зрозуміти, як працює нарахування балів у локальній грі
     - Виникли проблеми з базовими балами (+1/+2/+3)

### Правила гри

3. **[game-rules.md](game-rules.md)** - Основні правила гри
4. **[game-rules-logic.md](game-rules-logic.md)** - Детальна логіка гри
5. **[no-moves-rules.md](no-moves-rules.md)** - Правила "Ходів немає"

### Інтерфейс та навчання

6. **[keyboard-shortcuts.md](keyboard-shortcuts.md)** - Гарячі клавіші
7. **[onboarding.md](onboarding.md)** - Ознайомлення з грою
8. **[tutorial.md](tutorial.md)** - Навчальний посібник

## Швидкий пошук

### Як працює нарахування балів?
→ [bonus-scoring.md](bonus-scoring.md) - розділ "Базові бали" та "Бонусні бали"

### Чому в локальній грі не нараховуються базові бали?
→ [bonus-scoring.md](bonus-scoring.md) - розділ "Режими /game/local та /game/online"
→ [fair-scoring.md](fair-scoring.md) - розділ "Відмінності від Virtual-Player режиму"

### Як визначається переможець у локальній грі?
→ [fair-scoring.md](fair-scoring.md) - розділ "Визначення переможця"

### Що таке "зафіксовані бали" та "бали за поточне коло"?
→ [fair-scoring.md](fair-scoring.md) - розділ "Розділення рахунку"

### Чому переможець визначається некоректно?
→ [fair-scoring.md](fair-scoring.md) - розділ "Можливі проблеми та їх вирішення"

### Що таке actualGameMode vs settings.gameMode?
→ [fair-scoring.md](fair-scoring.md) - розділ "Технічні деталі реалізації"
→ [bonus-scoring.md](bonus-scoring.md) - розділ "Технічна реалізація"

## Для розробників

### Критичні технічні деталі

1. **actualGameMode** - фактичний режим гри з `BaseGameMode.getModeName()`
   - Значення: `'local'`, `'virtual-player'`, `'training'`, `'timed'`, `'online'`
   - Використовується для визначення, чи нараховувати базові бали

2. **settings.gameMode** - пресет налаштувань
   - Значення: `'observer'`, `'beginner'`, `'experienced'`, `'pro'`, `'local'`, etc.
   - НЕ використовується для логіки нарахування балів!

3. **score vs roundScore**
   - `score` - зафіксовані бали (з повних кіл)
   - `roundScore` - бали за поточне коло
   - Фіксація відбувається в `LocalGameMode.flushRoundScores()`

### Діагностика

Для діагностики проблем з балами увімкніть логування:
```javascript
// src/lib/services/logService.js
logConfig: {
  SCORE: true,
  GAME_MODE: true
}
```

Детальніше: [fair-scoring.md](fair-scoring.md) - розділ "Діагностика та логування"
