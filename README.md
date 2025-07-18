<!--
@Branch (Diff with Main Branch)

Commit message (English, copy-paste ready):

Unify and enlarge direction and distance buttons on the game page (+30%), refactor to use CSS variable for button size, harmonize font sizes, and improve UX consistency. Also, update board size and minor UI tweaks. Bump version to 0.2.24.
-->
# Stay on the Board

## Svelte-версія (актуальна архітектура)

### Швидкий старт

1. **Перейдіть до Svelte-додатку**
   ```bash
   cd svelte-app
   ```

2. **Встановіть залежності**
   ```bash
   npm install
   ```

3. **Запуск dev-сервера**
   ```bash
   npm run dev
   ```
   Відкрийте [http://localhost:5173](http://localhost:5173) у браузері.

4. **Розробка**
   - Додавайте нові Svelte-компоненти у `src/components/`
   - Для глобальних стилів використовуйте `src/app.css` або підключайте CSS у компонентах
   - Для логіки стану використовуйте Svelte stores (`src/stores/`)
   - Локалізація знаходиться у `src/lib/i18n/`

5. **Збірка для продакшну**
   ```bash
   npm run build
   ```
   Готові файли будуть у `dist/`.

---

## Структура проекту

```
Stay_on_the_board/
├── svelte-app/          # Svelte-додаток (основна частина)
│   ├── src/             # Код додатку
│   ├── static/          # Статичні ресурси (зображення, favicon)
│   └── package.json     # Залежності
├── docs/                # Документація
└── README.md           # Цей файл
```

---

## Важливо
- Проект повністю переведено на Svelte-архітектуру
- Legacy JavaScript-код видалено для спрощення підтримки
- Всі ресурси (зображення, локалізація) інтегровані в Svelte-додаток

---

## Корисні посилання
- [Svelte Documentation](https://svelte.dev/docs)
- [Vite + Svelte Guide](https://vitejs.dev/guide/)
- [SvelteKit Documentation](https://kit.svelte.dev/docs) 