# План міграції на Svelte

> **Примітка:** Під час міграції орієнтуйтеся насамперед на офіційну документацію Svelte/SvelteKit та сучасні best practices. Не копіюйте старий код без критичного аналізу, щоб уникнути перенесення старих багів у нову архітектуру.

---

## 1. Аналіз поточної архітектури

**Прогрес:** ![9%](https://progress-bar.dev/9/)

- [x] Провести аудит структури проєкту (HTML, CSS, JS)
- [x] Визначити всі основні UI-компоненти, сторінки, модулі логіки, маршрутизацію
- [x] Скласти список сторонніх бібліотек та залежностей
- [x] Виявити особливості логування, локалізації, темізації
- [x] Задокументувати всі знайдені особливості для подальшої міграції

---

## 2. Підготовка середовища Svelte

**Прогрес:** ![18%](https://progress-bar.dev/18/)

- [x] Створити новий Svelte/SvelteKit проєкт (`npm create svelte@latest`)
- [x] Налаштувати структуру папок (`src/routes`, `src/components`, `src/lib` тощо)
- [x] Додати необхідні залежності (наприклад, `svelte-routing`, `svelte-preprocess`, `eslint`, `prettier`)
- [x] Перенести favicon, логотипи, зображення у відповідні папки

---

## 3. Міграція стилів

**Прогрес:** ![27%](https://progress-bar.dev/27/)

- [x] Перенести глобальні CSS у `src/app.css` або відповідний глобальний файл
- [x] Розбити CSS на модулі для компонентів (або використати scoped styles у Svelte)
- [x] Перевірити та перенести CSS-змінні, теми, медіа-запити
- [x] Впровадити підтримку тем (через CSS custom properties або Svelte stores)
- [x] Перевірити адаптивність та кросбраузерність

---

## 4. Міграція UI-компонентів

**Прогрес:** ![100%](https://progress-bar.dev/100/)

- [x] Для кожного JS-компонента створити відповідний `.svelte`-файл у `src/components`
- [x] Переписати HTML-розмітку у шаблони Svelte (MainMenu, GameBoard, GameControls)
- [x] Перенести базову логіку з JS у `<script>` секції компонентів (навігація, переміщення, блокування, скидання)
- [x] Інтегрувати глобальний Svelte store для стану гри та навігації
- [x] Додати керування режимом блокування клітинок через GameControls
- [x] Додати скидання гри через GameControls
- [x] Замінити кастомні події на Svelte event forwarding (`on:event`)
- [x] Впровадити реактивність через `$:` та Svelte stores для всіх ігрових сценаріїв
- [x] Додати пропси, слоти, якщо потрібно

> **Виконано:**
> - Всі основні UI-компоненти перенесено у Svelte, інтегровано зі store.
> - Додано event forwarding, пропси, слоти, реактивність через `$:` та stores.

---

## 5. Міграція логіки стану

**Прогрес:** ![100%](https://progress-bar.dev/100/)

- [x] Інтегрувати централізоване логування у всі основні компоненти (GameBoard, GameControls, MainMenu, Modal)
- [x] Створити logStore.js для логування
- [x] Декомпозиція store: винести модалку у окремий modalStore.js
- [x] Явна типізація appState через JSDoc
- [x] Декомпозиція store: винести налаштування у окремий settingsStore.js
- [x] Переписати state management на Svelte stores (`writable`, `derived`, custom stores)
- [x] Замінити глобальні об’єкти/синглтони на Svelte stores
- [x] Інтегрувати логування у Svelte-компоненти (через окремий store або утиліту)
- [x] Перевірити роботу логування у всіх сценаріях

> **Виконано:**
> - Весь state management перенесено на Svelte stores (appState, modalStore, settingsStore, logStore).
> - Всі компоненти працюють через stores, глобальні об’єкти/синглтони не використовуються.
> - Логування інтегровано у всі основні сценарії.

---

## 6. Міграція роутінгу

**Прогрес:** ![60%](https://progress-bar.dev/60/)

- [x] Налаштувати маршрутизацію через файлову структуру SvelteKit (`src/routes`)
- [x] Створити сторінки для MainMenu, GameBoard, Settings, OnlineMenu, LocalGame, JoinRoom, WaitingForPlayer
- [x] Оновити навігацію у компонентах для переходу через SvelteKit routes (goto)
- [ ] Перенести всі сторінки та маршрути (контент Rules, Controls, інше)
- [ ] Перевірити навігацію, збереження стану між сторінками

> **Виконано:**
> - Основні сторінки створено, SPA-навігація працює через SvelteKit routes.
> - Навігація у MainMenu, GameBoard та інших компонентах оновлена на goto().
> - Далі — перенесення допоміжних сторінок (Rules, Controls) та перевірка збереження стану.

---

## 7. Міграція бізнес-логіки

**Прогрес:** ![0%](https://progress-bar.dev/0/)

- [ ] Перенести і адаптувати ігрову логіку, мережеві модулі, локалізацію
- [ ] Винести утиліти у окремі файли (`src/lib/utils`)
- [ ] Перевірити роботу всіх сценаріїв гри

---

## 8. Інтеграція сторонніх бібліотек

**Прогрес:** ![0%](https://progress-bar.dev/0/)

- [ ] Перевірити сумісність сторонніх бібліотек з Svelte
- [ ] Замінити несумісні бібліотеки на альтернативи
- [ ] Інтегрувати необхідні бібліотеки у Svelte-компоненти

---

## 9. Тестування

**Прогрес:** ![0%](https://progress-bar.dev/0/)

- [ ] Додати юніт-тести для Svelte-компонентів (наприклад, з `@testing-library/svelte`)
- [ ] Перевірити інтеграцію, логування, роботу всіх сценаріїв
- [ ] Провести ручне тестування основних флоу

---

## 10. Оптимізація та деплой

**Прогрес:** ![0%](https://progress-bar.dev/0/)

- [ ] Перевірити продуктивність, розмір бандлу
- [ ] Оптимізувати імпорти, lazy loading, tree-shaking
- [ ] Налаштувати деплой (Vercel, Netlify, GitHub Pages або власний сервер)
- [ ] Оновити документацію (README, інструкції по запуску, деплою, тестуванню)

---

## 11. Пост-міграційна підтримка

**Прогрес:** ![0%](https://progress-bar.dev/0/)

- [ ] Відстежувати баги, збирати фідбек користувачів
- [ ] Поступово видаляти старий код та непотрібні залежності
- [ ] Планувати подальші покращення та рефакторинг

---

### Додатково
- Вести чекліст виконаних кроків у цьому файлі
- Для кожного етапу створювати окрему гілку у git та PR для рев’ю
- Всі зміни супроводжувати логами для спрощення дебагу 

---

### 1. Створення структури папок
```powershell
mkdir C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css
mkdir C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\components
mkdir C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\layouts
mkdir C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\themes
mkdir C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\base
```

### 2. Копіювання CSS-файлів у відповідні папки
```powershell
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\components\controls.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\components\controls.css
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\components\game-board.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\components\game-board.css
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\components\modals.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\components\modals.css
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\layouts\main-menu.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\layouts\main-menu.css
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\themes\classic.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\themes\classic.css
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\themes\cs2.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\themes\cs2.css
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\themes\peak.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\themes\peak.css
copy C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\css\base\variables.css C:\Users\alik5\Documents\code\Stay_on_the_board\Stay_on_the_board\svelte-app\src\css\base\variables.css
```

### 3. Основний файл стилів:
```powershell
<code_block_to_apply_changes_from>
```

---

**Порядок:**  
1. Виконайте всі команди з блоку 1 (створення папок).
2. Далі — всі команди з блоку 2 (копіювання модульних стилів).
3. Останньою — команду з блоку 3 (основний стиль).

Після цього всі стилі будуть у потрібних місцях для інтеграції у SvelteKit!

### Як правильно запустити SvelteKit/Svelte-проєкт

1. **Перейдіть у папку SvelteKit-проєкту**  
   (наприклад, `cd svelte-app`)

2. **Встановіть залежності (якщо ще не встановлені):**
   ```
   npm install
   ```

3. **Запустіть dev-сервер:**
   ```
   npm run dev
   ```
   або (якщо це чистий Vite):
   ```
   npx vite
   ```

4. **Відкрийте у браузері адресу, яку покаже консоль**  
   (зазвичай це `http://localhost:5173/` або подібна).

---

#### Якщо у вас SvelteKit:
- Головна команда:  
  ```
  npm run dev
  ```
- Всі сторінки/роути працюють через цей сервер.

#### Якщо у вас чистий Svelte + Vite:
- Також використовуйте `npm run dev` або `npx vite`.

---

**ВАЖЛИВО:**  
Не відкривайте `index-svelte.html` напряму через файловий сервер або подвійний клік — це не працює для сучасних SPA/SSR-фреймворків.

---

**Підсумок:**  
1. Відкрийте термінал у папці `svelte-app`
2. Запустіть:
   ```
   npm install
   npm run dev
   ```
3. Перейдіть у браузері на адресу, яку видасть сервер (наприклад, http://localhost:5173/)

Якщо виникнуть помилки — надішліть їхній текст, допоможу розібратися! 

**Причина:**  
Ви запускаєте `npm run dev` у корені проєкту (`Stay_on_the_board`), а не у папці SvelteKit-проєкту (`svelte-app`).  
У корені немає package.json із потрібним скриптом.

---

## Як правильно запустити SvelteKit dev-сервер

1. **Перейдіть у папку SvelteKit-проєкту:**
   ```
   cd svelte-app
   ```

2. **Встановіть залежності (якщо ще не):**
   ```
   npm install
   ```

3. **Запустіть dev-сервер:**
   ```
   npm run dev
   ```

---

**Пояснення:**  
- Всі SvelteKit/Vite-команди (`npm run dev`, `npm run build`, тощо) потрібно запускати саме у папці, де є ваш SvelteKit-проєкт (де є `package.json` з цим скриптом).
- Якщо ви вже у VSCode, просто відкрийте термінал у папці `svelte-app` і повторіть команду.

---

**Що робити далі 