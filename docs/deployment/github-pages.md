# Тип: Інструкція
# Статус: Актуально
# Назва: Розгортання на GitHub Pages
# Мета: Надати покрокову інструкцію для коректного розгортання SvelteKit SPA на GitHub Pages без помилок 404.
# Опис: Документ містить комплексне рішення для налаштування базового шляху, кастомної 404.html та використання base для всіх посилань. Призначено для розробників, які деплоять SPA на GitHub Pages.

# Розгортання на GitHub Pages

Цей документ пояснює, як правильно налаштувати та розгорнути SvelteKit SPA (Single-Page Application) на GitHub Pages, щоб уникнути поширених проблем, таких як помилка 404 при прямому переході за посиланнями.

## 1. Проблема: Чому виникає помилка 404?

GitHub Pages — це хостинг для статичних файлів. Коли ви заходите за адресою `your-user.github.io/repo/game`, сервер шукає файл `game/index.html` або `game`. У SPA-додатках таких файлів немає; є лише один `index.html`, а вся маршрутизація (переходи між `/`, `/game`, `/rules`) обробляється на стороні клієнта за допомогою JavaScript.

Тому сервер не знаходить запитаний ресурс і повертає помилку 404.

## 2. Комплексне рішення

Рішення складається з трьох ключових частин, які мають працювати разом.

### Частина 1: Налаштування базового шляху в `svelte.config.js`

Потрібно вказати SvelteKit, що додаток буде знаходитись не в корені домену, а в піддиректорії (назва вашого репозиторію).

**Файл:** `svelte-app/svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-static';

const base = '/Stay_on_the_board'; // <-- ВАЖЛИВО!

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      base: base // <-- ВАЖЛИВО!
    }
  }
};

export default config;
```

### Частина 2: "Трюк" з `404.html`

Ми створюємо кастомну сторінку 404, яка перенаправляє всі запити на головний `index.html`, зберігаючи початковий шлях для роутера.

**Файл:** `svelte-app/static/404.html`
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/Stay_on_the_board/'">
  </head>
  <body>
    <p>Якщо вас не перенаправило автоматично, <a href="/Stay_on_the_board/">натисніть сюди</a>.</p>
    <script>
      (function(){
        var redirect = sessionStorage.redirect;
        delete sessionStorage.redirect;
        if (redirect && redirect != location.href) {
          history.replaceState(null, null, redirect);
        }
      })();
    </script>
  </body>
</html>
```
**Важливо:** Переконайтеся, що URL в `meta` та `a` тегах вказує на ваш `base` шлях.

### Частина 3: Використання `base` для всіх посилань та переходів

Щоб усі посилання та програмні переходи працювали коректно, завжди використовуйте змінну `base` з `$app/paths`.

**Для посилань в HTML/Svelte розмітці:**
```svelte
<script>
  import { base } from '$app/paths';
</script>

<a href="{base}/rules">Правила</a>
```

**Для програмної навігації (в `goto`):**
```javascript
import { goto } from '$app/navigation';
import { base } from '$app/paths';

function goHome() {
  goto(base || '/');
}
```
Це гарантує, що ваш додаток буде працювати коректно як локально, так і на GitHub Pages. 