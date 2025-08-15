import { test, expect } from '@playwright/test';

test.describe('Модальне вікно вибору режиму гри', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Вмикаємо тестовий режим програмно
    await page.evaluate(() => {
      const settingsStore = (window as any).settingsStore;
      if (settingsStore) {
        settingsStore.updateSettings({ testMode: true });
      }
    });
    await page.getByTestId('vs-computer-btn').click();
    await expect(page.getByTestId('game-mode-modal-title')).toBeVisible();
  });

  test('1. Повинно показувати FAQ для режиму "новачок"', { tag: '@GMM-1' }, async ({ page }) => {
    await page.getByTestId('beginner-mode-btn').click();
    await expect(page.getByTestId('modal-title')).toHaveAttribute('data-i18n-key', 'faq.title');
  });

  test('2. Не повинно показувати FAQ для режиму "досвідчений"', { tag: '@GMM-2' }, async ({ page }) => {
    await page.getByTestId('experienced-mode-btn').click();
    await expect(page.getByTestId('game-mode-modal')).not.toBeVisible();
    await expect(page).toHaveURL(/.*\/game\/vs-computer/);
  });

  test('3. Не повинно показувати FAQ для режиму "профі"', { tag: '@GMM-3' }, async ({ page }) => {
    await page.getByTestId('pro-mode-btn').click();
    await expect(page.getByTestId('game-mode-modal')).not.toBeVisible();
    await expect(page).toHaveURL(/.*\/game\/vs-computer/);
  });
});