# Тип: BUG
# Статус: Виконано
# Назва: Center-info порожній при швидких ходах після ходу комп'ютера
# Мета: Забезпечити, щоб анімація на дошці не впливала на відображення інформації в center-info, і ці процеси не блокували/не ламали один одного
# Опис: Якщо користувач робить хід дуже швидко після ходу комп'ютера (до завершення анімації на дошці), center-info стає порожнім. Це відбувається через те, що анімація на дошці і оновлення center-info не розділені, і один процес може перервати або зламати інший. Потрібно розділити ці два процеси, щоб вони не впливали один на одного.

---

## Кроки для відтворення
1. Зробити хід
2. Дочекатися ходу комп'ютера
3. Одразу після ходу комп'ютера (до завершення анімації) зробити ще один хід

## Актуальний результат
- center-info стає порожнім

## Очікуваний результат
- center-info завжди коректно відображає інформацію незалежно від стану анімації на дошці

---

## Додаткові завдання
- Перевірити, що ця логіка описана у відповідній документації (GAME_STATES.md, UI_COMPONENTS.md, NAVIGATION.md)
- Якщо не описана — додати опис
- Перевірити, що помилкова логіка (залежність center-info від анімації) відсутня в інших файлах 