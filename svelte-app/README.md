# Stay on the Board - Svelte App

Це основний Svelte-додаток проекту "Stay on the Board". Всі інші файли в корені репозиторію є документацією.

## Залежності

- **@sveltejs/kit** — основний фреймворк для SvelteKit
- **svelte** — ядро Svelte
- **vite** — білдер та дев-сервер
- **@sveltejs/adapter-auto** — адаптер для деплою
- **svelte-i18n** — локалізація (i18n)
- **@fontsource/fira-mono** — шрифт
- **@neoconfetti/svelte** — анімації конфетті
- **eslint, prettier, typescript, svelte-check, svelte-preprocess** — інструменти якості коду
- **rollup-plugin-visualizer** — аналізатор бандлу
- **yjs, y-webrtc** — peer-to-peer бібліотеки для синхронізації ігрового стану
- **simple-peer, peerjs** — бібліотеки для peer-to-peer WebRTC-зʼєднань
- **@testing-library/svelte** — тестування Svelte-компонентів
- **vitest** — сучасний тест-раннер для unit/e2e тестів

## Розробка

Після встановлення залежностей з `npm install`, запустіть сервер розробки:

```bash
npm run dev

# або запустіть сервер і відкрийте додаток в новій вкладці браузера
npm run dev -- --open
```

## Збірка

Для створення продакшн-версії додатку:

```bash
npm run build
```

Ви можете переглянути продакшн-збірку з `npm run preview`.

> Для деплою додатку може знадобитися встановити [адаптер](https://svelte.dev/docs/kit/adapters) для вашої цільової середовища.
