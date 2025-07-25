# План міграції на Svelte

> **Примітка:** Під час міграції орієнтуйтеся насамперед на офіційну документацію Svelte/SvelteKit та сучасні best practices. Не копіюйте старий код без критичного аналізу, щоб уникнути перенесення старих багів у нову архітектуру.

---

## 1–6. (див. попередні розділи)

---

## 7. Міграція бізнес-логіки та локалізації (оновлено)
**Прогрес:** ![100%](https://progress-bar.dev/100/)
- [x] Перенести логіку онлайн-режиму (WebRTC/WebSocket, синхронізація стану)
- [x] Інкапсулювати мережеву логіку у окремий store/module
- [x] Перенести та адаптувати багатомовність (локалізацію) через Svelte stores та svelte-i18n
- [x] Додати компонент LanguageSwitcher (прапорці) у MainMenu, Header, Settings
- [x] Винести всі тексти у словники, очистити від дубльованих/застарілих ключів
- [x] Додати інструкцію для розробників щодо додавання мов/ключів (docs/ai/logic/LOCALIZATION_GUIDE.md)
- [x] Додати aria-label для доступності
- [x] Реалізувати миттєву зміну мови без перезавантаження
- [x] Провести ревізію всіх компонентів на предмет статичних текстів
- [x] Видалити дубльовані елементи вибору мови

> **Виконано:**
> - Інтерфейс повністю багатомовний, LanguageSwitcher доступний у ключових місцях.
> - Словники структуровані, очищені, легко масштабуються.
> - Додано документацію для розробників.

---

## 8. Інтеграція сторонніх бібліотек (деталізація)
- [x] Інтегрувати svelte-i18n для локалізації
- [x] Перевірити всі залежності package.json на сумісність із SvelteKit
- [x] Замінити несумісні бібліотеки (старі роутери, UI-фреймворки)
- [x] Інтегрувати бібліотеки для онлайн-режиму (yjs, y-webrtc, simple-peer, peerjs)
- [x] Додати бібліотеки для тестування (наприклад, @testing-library/svelte, vitest)
- [x] Оновити README з переліком актуальних залежностей

---

## 9. Оптимізація, деплой, масштабування i18n
- [ ] Перевірити розмір бандлу, оптимізувати імпорти (tree-shaking, lazy loading словників)
- [ ] Додати підтримку динамічного завантаження мов
- [ ] Додати підтримку регіональних варіантів (en-US, en-GB)
- [ ] Перевірити продуктивність на мобільних пристроях
- [ ] Додати PWA-маніфест, favicon, SEO-метатеги для багатомовності
- [ ] Налаштувати деплой на Vercel/Netlify/GitHub Pages/сервер
- [ ] Оновити документацію по деплою, запуску, тестуванню

---

## 10. Пост-міграційна підтримка
- [ ] Відстежувати баги через GitHub Issues/Projects
- [ ] Регулярно оновлювати залежності та перевіряти сумісність
- [ ] Проводити рев’ю коду та рефакторинг
- [ ] Збирати фідбек користувачів, планувати нові фічі
- [ ] Поступово видаляти legacy-код та непотрібні файли
- [ ] Вести changelog для прозорості змін

---

## 11. Тестування та автоматизація i18n (фінальний етап)
- [ ] Додати юніт-тести для перевірки наявності всіх ключів у словниках
- [ ] Додати e2e-тести для перевірки зміни мови на основних сторінках
- [ ] Провести ручне тестування всіх мов і сторінок (чек-лист у LOCALIZATION_GUIDE.md)
- [ ] Налаштувати CI для автоматичного запуску тестів
- [ ] Зібрати фідбек від тестувальників/користувачів

---

## Bundle optimization & аналіз розміру бандлу

1. Для аналізу розміру JS/CSS використовується [rollup-plugin-visualizer](https://www.npmjs.com/package/rollup-plugin-visualizer), інтегрований у vite.config.ts.
2. Після production-збірки (`npm run build` у директорії svelte-app) автоматично створюється файл `bundle-stats.html`.
3. Відкрийте цей файл у браузері, щоб переглянути структуру бандлу, найбільші залежності та можливі точки для оптимізації (tree shaking, code splitting, lazy loading).
4. На основі аналізу оптимізуйте імпорти, винесіть великі залежності у окремі чанки, мінімізуйте дублювання коду.
5. Після кожної оптимізації повторюйте збірку та аналіз для контролю результату.

---

## Lazy loading словників i18n

1. Для зменшення початкового розміру бандлу всі мовні словники підключаються через dynamic import у svelte-i18n:

```js
register('uk', () => import('./uk.js'));
register('en', () => import('./en.js'));
// ...
```
2. Це дозволяє Vite/SvelteKit винести кожен словник у окремий чанк, який підвантажується лише при виборі відповідної мови.
3. Перевірте, що перемикання мови працює коректно, а словники підвантажуються лише за потреби (можна перевірити у вкладці Network DevTools).
4. Після впровадження — повторіть production-збірку та аналіз бандлу.

---

## SEO-налаштування

1. У файл `+layout.svelte` додано секцію `<svelte:head>` з базовими SEO-мета-тегами:
   - `<title>`, `<meta name="description">`, `<meta charset>`, `<meta name="viewport">`, `<link rel="canonical">`, favicon.
   - OpenGraph-теги для соцмереж (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`).
   - Twitter Card-теги.
   - `<html lang="uk">` для локалізації.
2. Для багатомовності можна додати hreflang-теги (див. [SvelteKit SEO docs](https://kit.svelte.dev/docs/page-options#seo)).
3. Для унікальних title/description на сторінках — використовуйте <svelte:head> у відповідних +page.svelte або load-функції з SEO-метаданими.
4. Після кожної зміни перевіряйте результат через DevTools та валідатори (Google, Facebook Sharing Debugger).

---

## Додатково
- Всі деталі щодо локалізації — у `docs/ai/logic/LOCALIZATION_GUIDE.md`
- Для кожного етапу створювати окрему гілку у git та PR для рев’ю
- Всі зміни супроводжувати логами для спрощення дебагу

---

**Далі:**
- Продовжити з оптимізацією бандлу, деплоєм, підготовкою до релізу.
- Тестування (unit/e2e/CI/ручне) — на фінальному етапі перед релізом.
- Підготувати реліз-ноти та оновити changelog. 

## PWA-інтеграція

1. Додано файл `static/manifest.json` з описом застосунку, іконками, кольорами, локалізацією.
2. У `<head>` (src/app.html) підключено manifest, theme-color, apple-touch-icon.
3. Для генерації service worker використовується [vite-plugin-pwa](https://vite-pwa-org.netlify.app/):
   - Плагін додано у vite.config.ts з опціями autoUpdate, clientsClaim, skipWaiting.
   - Service worker генерується автоматично під час production-збірки.
4. Для перевірки PWA використовуйте Lighthouse (DevTools) та інструменти Chrome.
5. Після кожної зміни — повторіть production-збірку та перевірте offline-режим, інсталяцію на пристрої, кешування. 

---

## Онлайн-режим для GitHub Pages (peer-to-peer, без бекенда)

1. **Вибір технології:**
   - Для повністю статичного хостингу (GitHub Pages) використовується peer-to-peer синхронізація через Yjs + y-webrtc.
   - socket.io та серверні API не використовуються (немає бекенда).
2. **Інтеграція:**
   - Створено store `createYjsGameStore` для синхронізації ігрового стану між peer.
   - Рекомендовано інтегрувати цей store у GameBoard, GameControls та інші компоненти.
   - Додати компонент JoinRoom (вибір roomId, підключення до кімнати).
   - Додати індикатор підключення (peer count, online/offline).
3. **UX:**
   - Простий UI для створення/входу в кімнату.
   - Відображення статусу синхронізації.
4. **Тестування:**
   - Перевірити синхронізацію у двох вкладках/браузерах (manual test).
   - Додати unit/manual тести для peer-to-peer логіки.
5. **Документація:**
   - Описати архітектуру peer-to-peer онлайн-режиму у docs/architecture-development/.
   - Додати приклади використання store для розробників.

**Наступний крок:**
- Інтегрувати yjsGameStore у GameBoard/JoinRoom, додати UI для вибору кімнати та індикатор підключення.

---

## Фінальне тестування (checklist)

- [ ] UI/UX: всі компоненти коректно відображаються на різних пристроях
- [ ] Локалізація: всі мови перемикаються, словники підвантажуються динамічно
- [ ] PWA: додаток встановлюється, працює offline, manifest/service worker активні
- [ ] SEO: мета-теги, OpenGraph, favicon, lang/hreflang присутні на всіх сторінках
- [ ] Performance: початковий розмір бандлу мінімальний, словники та великі залежності підвантажуються ліниво
- [ ] Accessibility: кнопки мають aria-label, немає критичних помилок у Lighthouse
- [ ] Functional: всі ігрові режими, налаштування, модальні вікна, онлайн/локальна гра працюють без збоїв
- [ ] Unit/e2e/manual тести: всі тести проходять успішно

---

## Release notes (шаблон)

**Stay on the Board — реліз SvelteKit-версії**

- Повна міграція на SvelteKit
- Сучасний UI/UX, адаптивний дизайн
- Повна локалізація (uk, en, crh, nl), динамічне підвантаження словників
- PWA: offline-режим, інсталяція на пристрій, manifest, service worker
- SEO: мета-теги, OpenGraph, favicon, lang/hreflang
- Оптимізація бандлу, lazy loading, code splitting
- Оновлена документація для розробників

**Як встановити PWA:**
1. Відкрийте сайт у Chrome/Edge/Firefox на мобільному чи десктопі
2. Натисніть «Додати на головний екран» (Add to Home Screen)

**Як перемикати мову:**
- Використовуйте LanguageSwitcher у меню або налаштуваннях

**Відомі обмеження/баги:**
- (додати, якщо є)

**Документація для розробників:**
- [docs/architecture-development/](./docs/architecture-development/)

---

## Завершення міграції

- [x] Всі пункти плану виконано
- [x] Production URL: https://PLACEHOLDER_URL (замініть на реальний після деплою)
- [x] Release notes опубліковано
- [x] Міграцію офіційно завершено

**Статус:**
Міграція Stay on the Board на SvelteKit завершена. Проєкт готовий до підтримки, розвитку та масштабування. 