# Stay on the Board

"Stay on the Board" — це стратегічна гра на витривалість та тренажер для просторової уяви. Гравці по черзі рухають одну спільну фігуру, намагаючись якомога довше утримати її на дошці.

## ✨ Основні можливості

*   **Гра проти AI:** Продуманий AI, який не робить помилок.
*   **Кастомізація UI:** Можливість перетягувати та налаштовувати розташування ігрових елементів.
*   **"Режим Профі":** Гра наосліп з озвучуванням ходів для тренування пам'яті.
*   **Система реплеїв:** Перегляд запису гри після її завершення.
*   **Гнучкі налаштування:** Налаштування розміру дошки, гарячих клавіш, тем та мов.

## 🚀 Швидкий старт

### Вимоги

*   [Node.js](https://nodejs.org/) (рекомендована версія LTS)
*   Пакетний менеджер `npm` (встановлюється разом з Node.js)

### Установка

1.  Клонуйте репозиторій:
    ```bash
    git clone https://github.com/your-username/Stay_on_the_board.git
    ```
2.  Перейдіть до директорії проєкту:
    ```bash
    cd Stay_on_the_board
    ```
3.  Встановіть всі залежності:
    ```bash
    npm install
    ```

### Запуск у режимі розробки

Щоб запустити локальний сервер для розробки з автоматичним перезавантаженням:
```bash
npm run dev
```
Після цього відкрийте вказану адресу (зазвичай `http://localhost:5173`) у вашому браузері.

## 🛠️ Скрипти

*   `npm run dev`: Запуск сервера для розробки.
*   `npm run build`: Збірка статичної версії сайту в папку `build`.
*   `npm run preview`: Локальний запуск продакшн-версії з папки `build`.
*   `npm run deploy`: Автоматична збірка та деплой на GitHub Pages.
*   `npm run check`: Запуск Svelte Check для перевірки типів та коду.

## 🏗️ Архітектура

Проєкт побудований на SvelteKit. Основна ігрова логіка розділена на віджети, що дозволяє гнучко налаштовувати інтерфейс. Детальніше про архітектуру можна прочитати в `docs/architecture/README.md`. 

## Архітектурні принципи

Детальний опис архітектурних принципів проєкту:
[docs/ai/architecture-principles.md](docs/ai/architecture-principles.md)

- Single Source of Truth (SSoT)
- Unidirectional Data Flow
- Separation of Concerns (SoC)
- Composition over Inheritance
- Purity and Side-Effect Minimization

## Регулярний аудит архітектури

- Після кожного великого рефакторингу або додавання складних фіч рекомендується проводити аудит архітектури за цими принципами.
- Всі зміни, що впливають на структуру стану, потік даних чи композицію компонентів, мають супроводжуватись оновленням документації. 

## Сервіси (Services)

### modalService
Централізований сервіс для роботи з модальними вікнами.

```js
import { modalService } from '$lib/services/modalService.js';

// Відкрити модальне вікно
modalService.showModal({
  titleKey: 'modal.title',
  content: 'Текст повідомлення',
  buttons: [
    { textKey: 'modal.ok', primary: true, onClick: modalService.closeModal }
  ]
});

// Закрити модальне вікно
modalService.closeModal();

// Підписка на стан
modalService.subscribe(state => { /* ... */ });
```

### logService
Централізований сервіс для логування дій, помилок, подій.

```js
import { logService } from '$lib/services/logService.js';

// Додати запис у лог
logService.addLog('Повідомлення', 'info');

// Очистити всі логи
logService.clearLogs();

// Підписка на логи
logService.subscribe(logs => { /* ... */ });
```

### speechService
Централізований сервіс для озвучення ходів, повідомлень тощо.

```js
import { speakText, loadAndGetVoices, filterVoicesByLang, langMap } from '$lib/services/speechService.js';

// Озвучити текст
speakText('Ваш хід', langMap.uk, null);

// Завантажити голоси
loadAndGetVoices().then(voices => { /* ... */ });

// Фільтрувати голоси за мовою
const ukVoices = filterVoicesByLang(voices, 'uk');
```

---

## Single Source of Truth (SSoT)
Всі основні дані та стани в грі зберігаються у централізованих Svelte stores. Для кожного типу стану (гра, налаштування, UI, логування, повтори, модальні вікна, розташування) існує окремий store, який є єдиним джерелом правди (SSoT). Всі компоненти підписуються на відповідні stores та не дублюють стан локально.

### Приклад підключення store
```js
import { gameState } from '$lib/stores/gameState.js';

// Підписка на стан гри
const unsubscribe = gameState.subscribe(state => {
  // ...
});
```

### Таблиця відповідності store → тип стану
| Store                | Тип стану         | Опис                                      |
|----------------------|-------------------|--------------------------------------------|
| `gameState`          | Гра               | Основний стан гри: позиція, хід, рахунок   |
| `appSettingsStore`      | Налаштування      | Всі налаштування користувача та гри        |
| `playerInputStore`   | Ввід гравця       | Поточний вибір напрямку/відстані           |
| `replayStore`        | Повтор            | Стан перегляду запису гри                  |
| `logService`         | Логування         | Логи дій, помилок, подій                   |
| `modalService`       | Модальні вікна    | Стан та вміст поточного модального вікна   |
| `layoutStore`        | Розташування      | Розташування віджетів на сторінці          |
| `columnStyleMode`    | UI/стиль          | Режим редагування/фіксації колонок         |

--- 