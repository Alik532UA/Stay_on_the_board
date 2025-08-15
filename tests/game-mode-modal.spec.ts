import { test, expect } from '@playwright/test';

test.describe('Модальне вікно вибору режиму гри', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('play-vs-computer-btn').click();
    await expect(page.getByTestId('game-mode-modal-title')).toBeVisible();
  });

  test('1. Повинно показувати FAQ для режиму "новачок"', async ({ page }) => {
    await page.getByTestId('beginner-mode-btn').click();
    await expect(page.getByTestId('faq-modal-title')).toBeVisible();
  });

  test('2. Не повинно показувати FAQ для режиму "досвідчений"', async ({ page }) => {
    await page.getByTestId('experienced-mode-btn').click();
    await expect(page.getByTestId('faq-modal')).not.toBeVisible();
    await expect(page).toHaveURL(/.*\/game\/vs-computer/);
  });

  test('3. Не повинно показувати FAQ для режиму "профі"', async ({ page }) => {
    await page.getByTestId('pro-mode-btn').click();
    await expect(page.getByTestId('faq-modal')).not.toBeVisible();
    await expect(page).toHaveURL(/.*\/game\/vs-computer/);
  });
});