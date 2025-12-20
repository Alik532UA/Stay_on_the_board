# Інструкція по злиттю гілки в `main`

Ця інструкція допоможе вам перенести зміни з вашої поточної робочої гілки в основну гілку `main` та відправити їх на віддалений сервер.

## Кроки

1.  **Дізнатися назву поточної гілки:**
    Перш за все, потрібно визначити, в якій гілці ви зараз працюєте.

    ```bash
    git branch --show-current
    ```

2.  **Додати зміни до індексу:**
    Ця команда додає всі змінені файли до списку для наступного коміту.

    ```bash
    git add .
    ```

3.  **Зробити коміт:**
    Збережіть ваші зміни з описовим повідомленням.

    ```bash
    git commit -m "fix(settings): Improve responsive layout and UI on settings page" -m "- Resolved an issue where elements on the settings page would overflow on mobile devices, causing a horizontal scrollbar.
    - Updated the game mode button group to use 'flex-wrap: wrap', allowing the buttons to stack vertically on smaller screens for better usability.
    - Adjusted the main page container width to 95% to provide better visual spacing and prevent content from touching the screen edges."
    ```

4.  **Переключитися на гілку `main`:**
    Перейдіть до основної гілки, щоб підготуватися до злиття.

    ```bash
    git checkout main
    ```

5.  **Об'єднати вашу гілку з `main`:**
    Замініть `<branch-name>` на назву вашої гілки, яку ви отримали на першому кроці.

    ```bash
    git merge <branch-name>
    ```

6.  **Відправити зміни на сервер:**
    Ця команда завантажить ваші зміни з локальної гілки `main` у віддалену.

    ```bash
    git push
    ```

7.  **Повернутися до вашої робочої гілки:**
    Після успішного злиття та відправки, поверніться до вашої гілки, щоб продовжити роботу.

    ```bash
    git checkout <branch-name>