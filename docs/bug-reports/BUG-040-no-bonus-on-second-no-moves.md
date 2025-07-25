# BUG-040: Не нараховуються бали за другий раз "Ходів немає"

**Тип:** Баг
**Статус:** Відкрито
**Назва:** Не нараховуються бали за другий раз натискання "Ходів немає" після продовження гри

---

## Кроки для відтворення
1. Зіграти гру до ситуації, коли немає доступних ходів.
2. Правильно визначити та натиснути "Ходів немає".
3. Отримати бонусні бали за "Ходів немає".
4. Обрати "Продовжити" (очистити заблоковані клітинки) та продовжити гру.
5. Знову зіграти до ситуації, коли немає доступних ходів.
6. Знову правильно визначити та натиснути "Ходів немає".

---

## Актуальний результат
За другий раз натискання "Ходів немає" бонусні бали **не нараховуються**.

## Очікуваний результат
За кожен раз, коли гравець правильно визначає ситуацію "Ходів немає" і натискає відповідну кнопку, має нараховуватись бонус (розмір дошки).

---

## Додатково
- Перевірити, чи скидається прапорець `noMovesClaimed` після продовження гри.
- Перевірити, чи логіка підрахунку бонусу враховує повторні ситуації. 