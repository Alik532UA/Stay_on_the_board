// svelte-app/src/lib/utils/navigation.js
import { goto } from '$app/navigation';
import { base } from '$app/paths';

/**
 * Навігує до головного меню, враховуючи базовий шлях.
 */
export function navigateToMainMenu() {
  goto(base || '/');
}

/**
 * Повертає користувача на попередню сторінку в історії браузера.
 * Це ідеально підходить для кнопок "Назад" або "Закрити".
 */
export function navigateBack() {
  history.back();
} 