# Локалізація (i18n) у Stay on the Board

## Як це працює

- Всі тексти інтерфейсу винесені у словники у `svelte-app/src/lib/i18n/uk.js`, `en.js`, `crh.js`, `nl.js`.
- Для перекладу використовується [svelte-i18n](https://github.com/kaisermann/svelte-i18n).
- Зміна мови здійснюється через компонент LanguageSwitcher (кнопки з прапорцями), який доступний у MainMenu, Header, Settings.

## Додавання/оновлення перекладів

1. **Додати новий ключ:**
   - Додайте ключ у всі словники (наприклад, `mainMenu.newFeature: "Новий функціонал"`).
   - Використовуйте у Svelte-компоненті: `{$_('mainMenu.newFeature')}`.

2. **Додати нову мову:**
   - Створіть файл, наприклад, `pl.js` у `svelte-app/src/lib/i18n/`.
   - Скопіюйте структуру з існуючого словника, перекладіть значення.
   - Додайте реєстрацію мови у `svelte-app/src/lib/i18n/index.js`:
     ```js
     import pl from './pl.js';
     register('pl', () => Promise.resolve(pl));
     ```
   - Додайте прапорець і назву у LanguageSwitcher.

3. **Використання у компонентах:**
   - Імпортуйте `{ _ }` з `svelte-i18n`.
   - Використовуйте `{$_('section.key')}` для перекладу.

4. **Додавання нових секцій:**
   - Додавайте секції за аналогією: `mainMenu`, `settings`, `header`, `gameBoard`, `gameControls`, `modal`, тощо.

## Важливо

- Не залишайте статичних текстів у компонентах — все через словники.
- Для accessibility використовуйте локалізовані aria-label.
- LanguageSwitcher — єдиний спосіб зміни мови для користувача. 