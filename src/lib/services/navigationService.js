// src/lib/services/navigationService.js
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { logService } from './logService';
import { modalStore } from '$lib/stores/modalStore';

export const navigationService = {
  /**
   * Переходить на вказаний маршрут, враховуючи базовий шлях.
   * @param {string} route - Маршрут, наприклад, '/game' або '/rules'.
   */
  goTo(route) {
    try {
      logService.ui('NavigationService: Navigating to', `${base}${route}`);
      goto(`${base}${route}`);
    } catch (error) {
      logService.ui('NavigationService: Error navigating to', route, error);
    }
  },

  /**
   * @param {string} route
   */
  resumeGame(route) {
    this.goTo(route);
  },

  /**
   * Переходить на головне меню.
   */
  goToMainMenu() {
    try {
      logService.ui('NavigationService: Going to main menu');
      modalStore.closeModal();
      this.goTo('/');
    } catch (error) {
      logService.ui('NavigationService: Error going to main menu', error);
    }
  },

  /**
   * Повертається на попередню сторінку в історії браузера.
   */
  goBack() {
    try {
      logService.ui('NavigationService: Going back');
      history.back();
    } catch (error) {
      logService.ui('NavigationService: Error going back', error);
    }
  }
}; 
