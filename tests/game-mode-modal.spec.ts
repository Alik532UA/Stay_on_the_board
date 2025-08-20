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

  test('1. Повинно показувати FAQ для режиму "новачок"', { tag: ['@done', '@GMM-1']  }, async ({ page }) => {
    await test.step('Вибір режиму "новачок" та перевірка FAQ', async () => {
      await page.getByTestId('beginner-mode-btn').click();
      await expect(page.getByTestId('faq-modal')).toBeVisible();
      await expect(page.getByTestId('faq-modal-title')).toHaveAttribute('data-i18n-key', 'faq.title');
      await page.getByTestId('modal-btn-modal.ok').click();
      await page.waitForURL('**/game/vs-computer');
      await expect(page.locator('.direction-controls-panel')).toBeVisible();
    });
  });

  test('2. Не повинно показувати FAQ для режиму "досвідчений"', { tag: ['@done', '@GMM-2'] }, async ({ page }) => {
    await test.step('Вибір режиму "досвідчений" та перевірка відсутності FAQ', async () => {
      await page.getByTestId('experienced-mode-btn').click();
      await expect(page.getByTestId('game-mode-modal')).not.toBeVisible();
      await page.waitForURL('**/game/vs-computer');
      await expect(page.locator('.direction-controls-panel')).toBeVisible();
    });
  });

  test('3. Не повинно показувати FAQ для режиму "профі"', { tag: ['@done', '@GMM-3'] }, async ({ page }) => {
    await test.step('Вибір режиму "профі" та перевірка відсутності FAQ', async () => {
      await page.getByTestId('pro-mode-btn').click();
      await expect(page.getByTestId('game-mode-modal')).not.toBeVisible();
      await page.waitForURL('**/game/vs-computer');
      await expect(page.locator('.direction-controls-panel')).toBeVisible();
    });
  });
});