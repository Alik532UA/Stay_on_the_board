# Інструкція: Як зробити веб-сайт встановлюваним (PWA)

Ця інструкція допоможе налаштувати проект на базі **Vite** (SvelteKit, React, Vue тощо) так, щоб його можна було встановити як застосунок на смартфон або комп'ютер.

## 1. Встановлення необхідного плагіна

У терміналі проекту виконайте команду:

```bash
npm install vite-plugin-pwa -D
```

## 2. Підготовка іконок

Для коректної роботи PWA (особливо на Android) критично важливо мати іконки правильних розмірів у папці `static` (або `public`).

Обов'язково додайте файли:
1.  **icon-192.png** (192x192 пікселів) — для домашнього екрану.
2.  **icon-512.png** (512x512 пікселів) — для завантажувального екрану (splash screen).
3.  **maskable-icon-512.png** (512x512 пікселів, опціонально, але бажано) — іконка з полями, яку система може обрізати під свій стиль (коло, квадрат тощо).

## 3. Налаштування `vite.config.ts`

Додайте налаштування плагіна `VitePWA`. Це "серце" вашого встановлюваного застосунку.

```typescript
import { sveltekit } from '@sveltejs/kit/vite'; // Або інший плагін фреймворку
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(), // Ваш основний плагін (React, Vue, SvelteKit)
    
    VitePWA({
      // 1. Автоматичне оновлення Service Worker
      registerType: 'autoUpdate', 
      
      // 2. Налаштування маніфесту (паспорт застосунку)
      manifest: {
        name: 'Назва Вашого Проекту',
        short_name: 'КороткаНазва',
        description: 'Опис вашого застосунку',
        theme_color: '#ffffff', // Колір шапки браузера/системи
        background_color: '#ffffff', // Колір фону при завантаженні
        display: 'standalone', // Режим "як застосунок" (без рядка адреси)
        orientation: 'portrait', // Бажана орієнтація (опціонально)
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png', // Шлях відносно папки static/public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      // 3. Які файли дозволити кешувати
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
      },

      // 4. Опція для тестування в режимі розробки (npm run dev)
      devOptions: {
        enabled: true,
        suppressWarnings: true
      }
    })
  ]
});
```

## 4. Налаштування `src/app.html` (або `index.html`)

У секцію `<head>` додайте мета-тег `theme-color`. Він повинен співпадати з тим, що вказано у маніфесті. Це дозволяє системі "зливатися" з шапкою застосунку.

```html
<head>
    <!-- ... інші теги ... -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
</head>
```

> **Примітка:** Не підключайте файл `manifest.json` вручну через `<link rel="manifest" ...>`. Плагін `vite-plugin-pwa` зробить це автоматично (або згенерує його віртуально). Якщо ви залишите ручне підключення старого файлу, це може призвести до конфліктів.

## 5. Перевірка

1.  Запустіть проект: `npm run dev`.
2.  Відкрийте Chrome.
3.  Відкрийте **DevTools** (F12) -> вкладка **Application**.
4.  Зліва оберіть **Manifest**. Ви повинні бачити свої налаштування та іконки без помилок.
5.  Якщо все вірно, у браузері (в адресному рядку праворуч) з'явиться іконка "Встановити" (Install).

## Часті помилки

*   **Відсутність іконки 512x512**: Chrome не запропонує встановлення без неї.
*   **Конфлікт маніфестів**: Якщо у вас є старий `static/manifest.json` і ви додали конфіг у Vite, видаліть старий файл.
*   **Sume сайту не на https**: PWA (Service Workers) працюють **тільки** через HTTPS (або на localhost).
