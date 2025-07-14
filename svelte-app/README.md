# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Dependencies

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

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
