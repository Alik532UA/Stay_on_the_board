# Тип: Баг-репорт
# Статус: Виконано
# Назва: Вікно "Вибір режиму гри" не закривається після вибору режиму
# Мета: Зафіксувати ситуацію, коли після вибору режиму вікно "Вибір режиму гри" залишається відкритим на сторінці гри.
# Опис: Після вибору режиму гри (наприклад, "Звичайний" або "Заблоковані клітинки") модальне вікно не закривається, і користувач бачить і сторінку гри, і це вікно одночасно. Також не завжди застосовується вибраний режим у налаштуваннях.

---

## Кроки для відтворення
1. Натиснути "Гра проти комп'ютера"
2. Вибрати режим

## Актуальний результат
- Відкривається сторінка гри
- Вікно "Вибір режиму гри" залишається відкритим

## Очікуваний результат
- Відкривається сторінка гри
- Вікно "Вибір режиму гри" закрито
- У налаштуваннях застосовано вибраний режим 