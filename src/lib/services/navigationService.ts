// src/lib/services/navigationService.ts
/**
 * @file Сервіс для навігації.
 */

import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { logService } from './logService';
import { modalStore } from '$lib/stores/modalStore';

export const navigationService = {
    goTo(route: string): void {
        try {
            logService.ui('NavigationService: Navigating to', `${base}${route}`);
            modalStore.closeAllModals(); // FIX: Гарантовано закриваємо всі модалки
            goto(`${base}${route}`);
        } catch (error) {
            logService.ui('NavigationService: Error navigating to', route, error);
        }
    },

    resumeGame(route: string): void {
        this.goTo(route);
    },

    goToMainMenu(): void {
        try {
            logService.ui('NavigationService: Going to main menu');
            modalStore.closeAllModals(); // FIX: Гарантовано закриваємо всі модалки
            goto(`${base}/`);
        } catch (error) {
            logService.ui('NavigationService: Error going to main menu', error);
        }
    },

    goBack(): void {
        try {
            logService.ui('NavigationService: Going back');
            modalStore.closeAllModals(); // Також закриваємо при натисканні "Назад"
            history.back();
        } catch (error) {
            logService.ui('NavigationService: Error going back', error);
        }
    }
};