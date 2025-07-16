// svelte-app/src/lib/utils/navigation.js
import { goto } from '$app/navigation';
import { base } from '$app/paths';

/**
 * Навігує до головного меню, враховуючи базовий шлях.
 */
export function navigateToMainMenu() {
  goto(base || '/');
} 