Звісно, ось детальний покроковий план рефакторингу компонента `MainMenu.svelte`.

# План рефакторингу компонента `MainMenu.svelte`

**Мета:** Спростити компонент `MainMenu.svelte`, винісши статичні дані (список мов) та обчислювану логіку (визначення SVG поточної мови) у централізовані модулі. Це покращить читабельність, підсилить принцип єдиного джерела правди (SSoT) та зробить компонент "чистішим".

**Поточний стан:** Компонент може містити локальне визначення списку мов та реактивну змінну для обчислення SVG прапора. Цей план переносить ці елементи у відповідні модулі: `constants.ts` та `derivedState.ts`.

---

### Крок 1: Централізація статичних даних (масив `languages`)

Перший крок — перенести масив з описом мов у централізований файл констант, щоб його можна було перевикористовувати в інших частинах застосунку.

- [ ] **Створити або оновити файл `$lib/constants.ts`.**
    Якщо файл ще не існує, створіть його. Переконайтеся, що він містить експортований масив `languages` з усією необхідною інформацією (код, SVG).

    **Код для `$lib/constants.ts`:**
    ```typescript
    // src/lib/constants.ts
    export const languages = [
      { code: 'uk', svg: `<svg ... >...</svg>` }, // Повний SVG для прапора України
      { code: 'en', svg: `<svg ... >...</svg>` }, // Повний SVG для прапора Великої Британії
      { code: 'crh', svg: `<svg ... >...</svg>` }, // Повний SVG для кримськотатарського прапора
      { code: 'nl', svg: `<svg ... >...</svg>` }  // Повний SVG для прапора Нідерландів
    ];
    ```
    *(Примітка: Повні SVG-коди вже є у вашому файлі `src/lib/constants.ts`, тому потрібно лише перевірити їх наявність).*

### Крок 2: Створення обчислюваного стору (`currentLanguageFlagSvg`)

Тепер створимо обчислюваний стор, який буде автоматично визначати SVG прапора на основі поточної мови, вибраної в `appSettingsStore`.

- [ ] **Оновити файл `$lib/stores/derivedState.ts`.**
    Додайте новий `derived` стор, який залежить від `appSettingsStore` та `languages` з `constants.ts`.

    **Код для додавання у `src/lib/stores/derivedState.ts`:**
    ```typescript
    import { derived } from 'svelte/store';
    import { appSettingsStore } from './appSettingsStore';
    import { languages } from '$lib/constants';

    // ... інші derived стори ...

    /**
     * Derived стор, що містить SVG поточного вибраного прапора.
     * @type {import('svelte/store').Readable<string>}
     */
    export const currentLanguageFlagSvg = derived(
      appSettingsStore,
      $appSettingsStore => {
        const currentLang = languages.find(lang => lang.code === $appSettingsStore.language);
        // Повертаємо SVG знайденої мови або SVG першої мови як запасний варіант
        return currentLang?.svg || languages[0].svg;
      }
    );
    ```

### Крок 3: Рефакторинг компонента `MainMenu.svelte`

На фінальному етапі оновимо сам компонент, щоб він використовував нові централізовані джерела даних та логіки.

- [ ] **Оновити імпорти у `<script>` блоці.**
    - Видаліть локальне визначення масиву `languages`.
    - Імпортуйте `languages` з `$lib/constants.ts`.
    - Імпортуйте `currentLanguageFlagSvg` з `$lib/stores/derivedState.ts`.

    **Старий код (приклад):**
    ```svelte
    <script>
      import { locale } from 'svelte-i18n';
      // ...
      const languages = [
        { code: 'uk', svg: '...' },
        // ...
      ];
      $: currentFlagSvg = languages.find(lang => lang.code === $locale)?.svg || '...';
    </script>
    ```

    **Новий код:**
    ```svelte
    <script>
      import { locale } from 'svelte-i18n';
      import { appSettingsStore } from '$lib/stores/appSettingsStore.js';
      import { currentLanguageFlagSvg } from '$lib/stores/derivedState.js'; // <-- Новий імпорт
      import { languages } from '$lib/constants.js'; // <-- Новий імпорт
      // ...
      // Рядок "$: currentFlagSvg = ..." видалено
    </script>
    ```

- [ ] **Оновити шаблон (HTML).**
    - Замініть використання локальної змінної `currentFlagSvg` на `$currentLanguageFlagSvg`.
    - Переконайтеся, що цикл `#each` для випадаючого списку мов використовує імпортований масив `languages`.

    **Оновлення для кнопки вибору мови:**
    ```html
    <!-- ... -->
    <button class="main-menu-icon" ...>
      <span class="main-menu-icon-inner">
        {@html $currentLanguageFlagSvg} <!-- Використовуємо derived store -->
      </span>
    </button>
    <!-- ... -->
    ```

    **Оновлення для випадаючого списку:**
    ```html
    <!-- ... -->
    {#if showLangDropdown}
      <div class="lang-dropdown ...">
        <!-- Переконуємося, що тут використовується імпортований масив -->
        {#each languages as lang (lang.code)} 
          <button class="lang-option" onclick={() => selectLang(lang.code)} ...>
            {@html lang.svg}
          </button>
        {/each}
      </div>
    {/if}
    <!-- ... -->
    ```

### Крок 4: Верифікація

Після внесення змін необхідно перевірити коректність роботи функціоналу.

- [ ] **Перевірка відображення:**
    - Завантажте головне меню. Переконайтеся, що іконка поточної мови відображається правильно.
- [ ] **Перевірка випадаючого списку:**
    - Натисніть на іконку мови. Переконайтеся, що випадаючий список містить усі мови з файлу `constants.ts`.
- [ ] **Перевірка зміни мови:**
    - Виберіть іншу мову зі списку. Переконайтеся, що іконка на кнопці оновилася, а текст на сторінці змінився.
- [ ] **Перевірка збереження стану:**
    - Оновіть сторінку. Переконайтеся, що вибрана мова та відповідна іконка збереглися.