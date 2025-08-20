import { test, expect } from '@playwright/test';
import { startNewGame, makeFirstMove, GameMode } from './utils';

test.describe('Модальне вікно підтвердження зміни розміру дошки', () => {
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
  });

  test('1. Не повинно з`являтися, якщо рахунок 0', { tag: ['@done', '@BRM-1'] }, async ({ page }) => {
    await test.step('Перевірка, що модальне вікно не з\'являється при нульовому рахунку', async () => {
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
      await page.getByTestId('increase-board-size-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
    });
  });

  test('2. Повинно з`являтися, якщо рахунок не 0', { tag: ['@done', '@BRM-2'] }, async ({ page }) => {
    await test.step('Перевірка, що модальне вікно з\'являється, коли рахунок не нульовий', async () => {
      await makeFirstMove(page);
      await page.getByTestId('increase-board-size-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
      await expect(page.getByTestId('board-resize-confirm-modal-title')).toHaveAttribute('data-i18n-key', 'modal.resetScoreTitle');
    });
  });

  test('3. Спочатку не з`являється (рахунок 0), потім з`являється (рахунок не 0)', { tag: ['@done', '@BRM-3'] }, async ({ page }) => {
    await test.step('Етап 1: Рахунок 0, модальне вікно не з\'являється', async () => {
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
      await page.getByTestId('increase-board-size-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
    });

    await test.step('Етап 2: Робимо хід, щоб змінити рахунок', async () => {
      await makeFirstMove(page);
    });

    await test.step('Етап 3: Рахунок не 0, модальне вікно з\'являється', async () => {
      await page.getByTestId('increase-board-size-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
      await expect(page.getByTestId('board-resize-confirm-modal-title')).toHaveAttribute('data-i18n-key', 'modal.resetScoreTitle');
    });
  });
});