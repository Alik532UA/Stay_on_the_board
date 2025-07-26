// src/lib/services/navigationService.js
import { goto } from '$app/navigation';
import { base } from '$app/paths';

export const navigationService = {
  /**
   * Переходить на вказаний маршрут, враховуючи базовий шлях.
   * @param {string} route - Маршрут, наприклад, '/game' або '/rules'.
   */
  goTo(route) {
    try {
      console.log('NavigationService: Navigating to', `${base}${route}`);
      goto(`${base}${route}`);
    } catch (error) {
      console.error('NavigationService: Error navigating to', route, error);
    }
  },

  /**
   * Переходить на головне меню.
   */
  goToMainMenu() {
    try {
      console.log('NavigationService: Going to main menu');
      this.goTo('/');
    } catch (error) {
      console.error('NavigationService: Error going to main menu', error);
    }
  },

  /**
   * Повертається на попередню сторінку в історії браузера.
   */
  goBack() {
    try {
      console.log('NavigationService: Going back');
      history.back();
    } catch (error) {
      console.error('NavigationService: Error going back', error);
    }
  }
}; 