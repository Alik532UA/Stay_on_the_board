# Stay on the Board

## Svelte-версія (нова архітектура)

### Швидкий старт для Svelte

1. **Встановіть залежності**

   Якщо ще не створено, ініціалізуйте Svelte-проєкт у цій папці:
   ```bash
   npm create vite@latest . -- --template svelte
   npm install
   ```
   > ⚠️ Якщо Vite/SvelteKit вже налаштовано, цей крок пропустіть.

2. **Структура Svelte-версії**
   - `index-svelte.html` — точка входу для Svelte-додатку
   - `src/main-svelte.js` — стартовий файл для Svelte
   - `src/App.svelte` — головний компонент

3. **Запуск dev-сервера**
   ```bash
   npm run dev
   ```
   або (якщо використовується Vite):
   ```bash
   npx vite
   ```
   Відкрийте [http://localhost:5173/index-svelte.html](http://localhost:5173/index-svelte.html) у браузері.

4. **Розробка**
   - Додавайте нові Svelte-компоненти у `src/components/`
   - Для глобальних стилів використовуйте `src/app.css` або підключайте CSS у компонентах
   - Для логіки стану використовуйте Svelte stores (`src/stores/`)

5. **Збірка для продакшну**
   ```bash
   npm run build
   ```
   Готові файли будуть у `dist/` (або `build/` залежно від налаштувань).

---

## Важливо
- Орієнтуйтеся на офіційну документацію Svelte/SvelteKit та сучасні best practices.
- Не копіюйте старий код без критичного аналізу, щоб уникнути перенесення багів.
- Стару версію можна знайти у `index-js.html`.

---

## Корисні посилання
- [Svelte Documentation](https://svelte.dev/docs)
- [Vite + Svelte Guide](https://vitejs.dev/guide/)
- [SvelteKit Documentation](https://kit.svelte.dev/docs) 