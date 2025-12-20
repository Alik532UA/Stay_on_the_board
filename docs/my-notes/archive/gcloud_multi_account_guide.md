Звісно, чудова ідея! Додавання процесу ініціалізації зробить інструкцію повною та логічною. Я оновив ваш Markdown-файл, додавши новий розділ про налаштування конфігурації та виконавши ваш `TODO`.

Ось оновлена версія:

---

# Налаштування Google Cloud CLI для роботи з кількома акаунтами та Gemini

Цей документ є інструкцією з вирішення проблеми, коли `gcloud` CLI або пов'язані з ним інструменти (наприклад, `gemini`) використовують неправильний проект Google Cloud, що призводить до помилки `PERMISSION_DENIED`, незважаючи на правильний вхід в обліковий запис.

## Проблема

Після входу в новий обліковий запис Google Cloud CLI продовжував надсилати запити до старого проекту, що призводило до помилки доступу. Команда `gcloud config list` показувала правильний акаунт та проект, але помилка все одно виникала.

## Частина 1: Правильне налаштування кількох акаунтів за допомогою конфігурацій

Найкращий спосіб керувати кількома обліковими записами та проектами — це використовувати вбудовані конфігурації `gcloud`. Це дозволяє створювати ізольовані набори налаштувань (акаунт, проект, регіон) і легко перемикатися між ними.

**Примітка:** Усі наведені нижче команди слід виконувати в терміналі, де доступний `gcloud` CLI. Найпростіший спосіб у Windows — це запустити **"Google Cloud SDK Shell"** з меню "Пуск".

### 1.1. Створення та налаштування нової конфігурації

Процес складається з двох кроків: створення пустої конфігурації та її подальша ініціалізація (прив'язка до акаунта та проекту).

**Крок 1: Створити нову конфігурацію**
```bash
# Замініть <configuration_name> на зрозумілу назву (наприклад, за іменем акаунта)
    gcloud config configurations create <configuration_name>
    gcloud config configurations create g-a-m0
    gcloud config configurations create g-a-m1
    gcloud config configurations create g-a-m2
    gcloud config configurations create g-a-m3
    gcloud config configurations create g-a-m4
    gcloud config configurations create g-a-m7
    gcloud config configurations create g-a-m8
    gcloud config configurations create g-a-m9
    gcloud config configurations create g-a-m10
    gcloud config configurations create g-a-m11
    gcloud config configurations create g-a-m12
    gcloud config configurations create g-a-m13
    gcloud config configurations create g-a-m14
    gcloud config configurations create g-a-m15
    gcloud config configurations create g-a-m16
    gcloud config configurations create g-a-m17
    gcloud config configurations create g-a-m18
```
*Приклад:*
```bash
gcloud config configurations create g-a-m0
```Після створення конфігурація автоматично стає активною.

**Крок 2: Ініціалізувати (налаштувати) конфігурацію**
Запустіть процес ініціалізації для щойно створеної активної конфігурації.

```bash
gcloud init
```
Далі дотримуйтесь інструкцій у терміналі:
1.  **Виберіть дію:** Система запропонує кілька варіантів. Виберіть `[1] Re-initialize this configuration [your-new-config-name] with new settings`.
2.  **Виберіть обліковий запис:**
    *   Вам буде запропоновано список уже відомих акаунтів.
    *   Щоб увійти в абсолютно новий акаунт, виберіть `[3] Sign in with a new Google Account`.
3.  **Авторизація в браузері:** Дотримуйтесь інструкцій у вікні браузера, що відкриється, щоб увійти та надати дозволи.
4.  **Виберіть проект:** Після повернення до терміналу вам буде запропоновано список проектів, доступних для цього акаунта. Виберіть потрібний, ввівши його номер.

### 1.2. Основні команди для керування конфігураціями

**Переглянути список усіх конфігурацій:**
```bash
gcloud config configurations list
```

**Переключитися між конфігураціями (зробити одну з них активною):**
```bash
# Працюємо з першим акаунтом
gcloud config configurations activate alik532

# Працюємо з другим акаунтом
gcloud config configurations activate alikzapolnov

# Працюємо з акаунтом g-a-*
gcloud config configurations activate g-a-m1
gcloud config configurations activate g-a-m2
gcloud config configurations activate g-a-m3
gcloud config configurations activate g-a-m4
gcloud config configurations activate g-a-m7
gcloud config configurations activate g-a-m8
gcloud config configurations activate g-a-m9
gcloud config configurations activate g-a-m10
gcloud config configurations activate g-a-m11
gcloud config configurations activate g-a-m12
gcloud config configurations activate g-a-m13
gcloud config configurations activate g-a-m14
gcloud config configurations activate g-a-m15
gcloud config configurations activate g-a-m16
gcloud config configurations activate g-a-m17
gcloud config configurations activate g-a-m18
```

## Частина 2: Вирішення конфлікту пріоритетів

Навіть при правильно налаштованих конфігураціях CLI може використовувати неправильний проект, якщо встановлена **змінна середовища**, яка має вищий пріоритет.

### Ієрархія налаштувань проекту:

1.  **Найвищий пріоритет:** Змінна середовища `GOOGLE_CLOUD_PROJECT`.
2.  **Середній пріоритет:** Проект, вказаний в активній конфігурації `gcloud`.

У нашому випадку змінна `GOOGLE_CLOUD_PROJECT` була встановлена зі значенням старого проекту, що ігнорувало налаштування активної конфігурації.

### Як виправити

1.  **Перевірити наявність змінної середовища** (у PowerShell):
    ```powershell
    echo $env:GOOGLE_CLOUD_PROJECT
    ```

2.  **Тимчасово видалити змінну** для поточної сесії терміналу:
    ```powershell
    Remove-Item Env:\GOOGLE_CLOUD_PROJECT
    ```
    Після цього команди `gemini` та `gcloud` почнуть використовувати проект з активної конфігурації.

3.  **Видалити змінну назавжди** (рекомендовано):
    *   Відкрийте "Змінити системні змінні середовища" у Windows.
    *   Натисніть "Змінні середовища...".
    *   Знайдіть `GOOGLE_CLOUD_PROJECT` у списку змінних користувача або системних змінних та видаліть її.
    *   Перезапустіть VS Code та всі термінали.

## Частина 3: Активація необхідного API

Для роботи `gemini` CLI необхідно, щоб у вашому проекті Google Cloud був увімкнений **Cloud AI Companion API**.

*   **Важливо:** Це потрібно зробити для **кожного** проекту, з яким ви плануєте використовувати `gemini`.

1.  Перейдіть за посиланням, вибравши правильний обліковий запис Google у браузері.
2.  Виберіть потрібний проект зі спадного меню.
3.  Натисніть кнопку "Увімкнути" (Enable).

**Посилання для активації API:**
https://console.cloud.google.com/apis/library/cloudaicompanion.googleapis.com?authuser=8
---

## Підсумковий "Чек-лист"

Якщо ви знову зіткнулися з помилкою `PERMISSION_DENIED`:

1.  **Перевірте активну конфігурацію:** `gcloud config list`
2.  **Переконайтеся, що активна правильна конфігурація:** `gcloud config configurations activate <your_config_name>`
3.  **Перевірте змінну середовища:** `echo $env:GOOGLE_CLOUD_PROJECT` (і видаліть її, якщо вона є).
4.  **Перевірте, чи увімкнено API** для **правильного** проекту за посиланням вище.