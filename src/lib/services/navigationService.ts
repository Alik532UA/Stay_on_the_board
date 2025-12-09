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
            modalStore.closeModal();
            this.goTo('/');
        } catch (error) {
            logService.ui('NavigationService: Error going to main menu', error);
        }
    },

    goBack(): void {
        try {
            logService.ui('NavigationService: Going back');
            history.back();
        } catch (error) {
            logService.ui('NavigationService: Error going back', error);
        }
    }
};
