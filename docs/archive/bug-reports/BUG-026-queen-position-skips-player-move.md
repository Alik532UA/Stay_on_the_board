---
id: BUG-026
title: Візуалізація ферзя пропускає хід гравця і одразу показує хід комп'ютера
status: In Progress
created: 2025-07-22
---

### Опис

Після ходу користувача візуальне положення ферзя на дошці не оновлюється до позиції гравця. Замість цього, воно миттєво перестрибує на кінцеву позицію після ходу комп'ютера.

### Очікувана поведінка

1.  Гравець робить хід.
2.  Ферзь плавно анімується на клітинку, обрану гравцем.
3.  Після короткої паузи ферзь плавно анімується на клітинку, обрану комп'ютером.

### Фактична поведінка

Після ходу гравця ферзь одразу анімується на клітинку, обрану комп'ютером, пропускаючи проміжний стан. 