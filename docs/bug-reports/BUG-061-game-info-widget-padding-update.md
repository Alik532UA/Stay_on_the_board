---
id: BUG-061
title: Оновлення padding для GameInfoWidget до 12px
status: fixed
---

### Опис

Потрібно встановити padding 12px для всіх елементів в `game-info-widget` для покращення візуального вигляду та уніфікації дизайну.

### Кроки для відтворення

1. Відкрити гру
2. Подивитися на GameInfoWidget
3. Актуальний результат: padding 24px 18px
4. Очікуваний результат: padding 12px

### Причина проблеми

GameInfoWidget мав занадто великий padding (24px 18px), що не відповідало загальному дизайну інтерфейсу.

### Виправлення

**Оновлено padding в GameInfoWidget:**

```css
/* Було: */
.game-info-widget {
  padding: 24px 18px;
  /* ... інші стилі ... */
}

/* Стало: */
.game-info-widget {
  padding: 12px;
  /* ... інші стилі ... */
}
```

### Результат

Тепер GameInfoWidget має уніфікований padding 12px, що покращує візуальний вигляд та відповідає загальному дизайну інтерфейсу.

### Технічні деталі

- **Файл змінено:** `src/lib/components/widgets/GameInfoWidget.svelte`
- **Зміна:** padding з `24px 18px` на `12px`
- **Вплив:** Покращення візуального вигляду GameInfoWidget 