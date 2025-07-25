# Тип: BUG
# Статус: Виконано
# Назва: Не підсвічується вибраний режим у game-mode-row після вибору у модалці
# Мета: Забезпечити, щоб після вибору режиму у модальному вікні, у блоці game-mode-row у налаштуваннях був підсвічений саме цей режим
# Опис: Після вибору режиму гри у модальному вікні "Вибір режиму гри" та переходу на сторінку гри, у налаштуваннях (game-mode-row) не підсвічується вибраний режим. Це може призвести до плутанини для користувача.

---

## Кроки для відтворення
1. Натиснути "Гра проти комп'ютера" на головному меню
2. Вибрати будь-який режим у модальному вікні
3. Перейти у налаштування

## Актуальний результат
- У блоці game-mode-row не підсвічується вибраний режим

## Очікуваний результат
- У блоці game-mode-row підсвічується саме той режим, який був вибраний у модальному вікні

---

## Додаткові завдання
- Перевірити, що ця логіка описана у відповідній документації (GAME_RULES.md, GAME_STATES.md, NAVIGATION.md, UI_COMPONENTS.md)
- Якщо не описана — додати опис
- Перевірити, що помилкова логіка (окреме поле для режиму) відсутня в інших файлах 