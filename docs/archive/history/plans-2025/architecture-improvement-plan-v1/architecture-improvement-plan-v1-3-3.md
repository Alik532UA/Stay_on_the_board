Звісно. Цей етап спрямований на формалізацію роботи з побічними ефектами, такими як аудіо та навігація. Ми перетворимо існуючі файли на повноцінні сервіси, щоб зробити їх використання більш явним та структурованим.

---

### Детальний План: Ізоляція Побічних Ефектів

**Мета:** Винести всю логіку, пов'язану з аудіо та навігацією, в окремі сервіси. Це дозволить `GameOrchestrator` та компонентам просто викликати методи (`audioService.play()`, `navigationService.goToMainMenu()`), не замислюючись про їхню внутрішню реалізацію.

---

### Частина 1: Формалізація `AudioService`

Ми перетворимо `audioStore.js` на `audioService.js`, щоб його назва краще відповідала його ролі (керування побічними ефектами, а не просто зберігання стану).

#### Крок 1: Перейменування та рефакторинг файлу

1.  **Перейменуйте файл:**
    *   `src/lib/stores/audioStore.js` -> `src/lib/services/audioService.js`

2.  **Відкрийте новий файл** `src/lib/services/audioService.js` і оновіть його вміст, щоб він експортував єдиний об'єкт-сервіс.

    **Було (`audioStore.js`):**
    ```javascript
    // ...
    export const audioControls = {
      play() { /* ... */ },
      pause() { /* ... */ },
      // ...
    };
    ```

    **Стане (`audioService.js`):**
    ```javascript
    // src/lib/services/audioService.js
    import { base } from '$app/paths';

    /** @type {HTMLAudioElement|null} */
    let audioInstance = null;

    const getAudio = () => {
      if (typeof window === 'undefined') return null;
      if (!audioInstance) {
        audioInstance = new Audio(`${base}/dont-push-the-horses.weba`);
        audioInstance.loop = true;
      }
      return audioInstance;
    };

    export const audioService = {
      play() {
        const audio = getAudio();
        if (audio && audio.paused) {
          audio.currentTime = 0;
          audio.play().catch(e => console.error("Audio play failed:", e));
        }
      },
      pause() {
        const audio = getAudio();
        if (audio && !audio.paused) {
          audio.pause();
        }
      },
      setVolume(volume) {
        const audio = getAudio();
        if (audio) {
          audio.volume = Math.max(0, Math.min(1, volume));
        }
      },
      loadVolume() {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('expertModeVolume');
          return saved !== null ? parseFloat(saved) : 0.3;
        }
        return 0.3;
      },
      saveVolume(volume) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('expertModeVolume', String(volume));
        }
      }
    };
    ```

#### Крок 2: Оновлення імпортів та викликів

1.  **Виконайте пошук по всьому проєкту** за рядком `from '$lib/stores/audioStore.js'`.
2.  **Замініть імпорти та виклики.**

    **Приклад у `Modal.svelte`:**
    **Було:**
    ```svelte
    <script>
      import { audioControls } from '$lib/stores/audioStore.js';
      // ...
      onMount(() => {
        expertVolume = audioControls.loadVolume();
        return () => {
          audioControls.pause();
        };
      });
      // ...
      audioControls.setVolume(expertVolume);
      audioControls.saveVolume(expertVolume);
      // ...
    </script>
    ```

    **Стане:**
    ```svelte
    <script>
      import { audioService } from '$lib/services/audioService.js'; // <-- ЗМІНА ТУТ
      // ...
      onMount(() => {
        expertVolume = audioService.loadVolume(); // <-- ЗМІНА ТУТ
        return () => {
          audioService.pause(); // <-- ЗМІНА ТУТ
        };
      });
      // ...
      audioService.setVolume(expertVolume); // <-- ЗМІНА ТУТ
      audioService.saveVolume(expertVolume); // <-- ЗМІНА ТУТ
      // ...
    </script>
    ```

---

### Частина 2: Формалізація `NavigationService`

Ми перетворимо `navigation.js` на `navigationService.js`, щоб підкреслити його роль як централізованого сервісу для всіх дій, пов'язаних з навігацією.

#### Крок 1: Перейменування та рефакторинг файлу

1.  **Перейменуйте файл:**
    *   `src/lib/utils/navigation.js` -> `src/lib/services/navigationService.js`

2.  **Відкрийте новий файл** `src/lib/services/navigationService.js` і оновіть його вміст.

    **Було (`navigation.js`):**
    ```javascript
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export function navigateToMainMenu() {
      goto(base || '/');
    }
    export function navigateBack() {
      history.back();
    }
    ```

    **Стане (`navigationService.js`):**
    ```javascript
    // src/lib/services/navigationService.js
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export const navigationService = {
      /**
       * Переходить на вказаний маршрут, враховуючи базовий шлях.
       * @param {string} route - Маршрут, наприклад, '/game' або '/rules'.
       */
      goTo(route: string) {
        goto(`${base}${route}`);
      },

      /**
       * Переходить на головне меню.
       */
      goToMainMenu() {
        this.goTo('/');
      },

      /**
       * Повертається на попередню сторінку в історії браузера.
       */
      goBack() {
        history.back();
      }
    };
    ```

**Пояснення:** Ми створили єдиний об'єкт `navigationService` і додали більш універсальний метод `goTo`, щоб уникнути дублювання `goto(${base}${route})` в різних місцях.

#### Крок 2: Оновлення імпортів та викликів

1.  **Виконайте пошук по всьому проєкту** за рядком `from '$lib/utils/navigation.js'`.
2.  **Замініть імпорти та виклики.**

    **Приклад у `FloatingBackButton.svelte`:**
    **Було:**
    ```svelte
    <script>
      import { navigateBack } from '$lib/utils/navigation.js';
    </script>
    <button onclick={navigateBack}>...</button>
    ```
    **Стане:**
    ```svelte
    <script>
      import { navigationService } from '$lib/services/navigationService.js';
    </script>
    <button onclick={navigationService.goBack}>...</button>
    ```

    **Приклад у `uiService.js` (після попереднього рефакторингу):**
    **Було:**
    ```javascript
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    // ...
    goto(`${base}/game`);
    ```
    **Стане:**
    ```javascript
    import { navigationService } from '$lib/services/navigationService.js';
    // ...
    navigationService.goTo('/game');
    ```

---

### Результат та Перевірка

-   **Інкапсуляція:** Вся логіка роботи з аудіо та навігацією тепер знаходиться всередині відповідних сервісів.
-   **Чистий API:** Компоненти та оркестратор тепер використовують зрозумілі методи (`audioService.play()`, `navigationService.goTo('/rules')`), що покращує читабельність.
-   **Легкість мокування:** При тестуванні ви зможете легко "замокати" ці сервіси, щоб перевірити логіку, не викликаючи реальних побічних ефектів.

**Що протестувати:**

1.  **Аудіо:**
    *   Перевірте, що музика у вікні "Expert Mode" вмикається, вимикається, а гучність регулюється і зберігається після перезавантаження.
2.  **Навігація:**
    *   Перевірте роботу всіх кнопок, які використовують навігацію: "Головне меню", "Назад", переходи на сторінки "Правила", "Керування" тощо.
    *   Переконайтеся, що всі посилання працюють коректно, особливо з урахуванням `base` шляху для GitHub Pages.