import { test, expect } from '@playwright/test';
import { startNewGame, makeFirstMove, GameMode } from './utils';

test.describe('[Done] Модальне вікно підтвердження зміни розміру дошки', () => {
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
  });

  test('1. Не повинно з\'являтися, якщо рахунок 0', async ({ page }) => {
    await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
    await page.getByTestId('increase-board-size-btn').click();
    await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
  });

  test('2. Повинно з\'являтися, якщо рахунок не 0', async ({ page }) => {
    await makeFirstMove(page);
    await page.getByTestId('increase-board-size-btn').click();
    await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
    await expect(page.getByTestId('modal-window-title')).toHaveAttribute('data-i18n-key', 'modal.resetScoreTitle');
  });

  test('3. Спочатку не з\'являється (рахунок 0), потім з\'являється (рахунок не 0)', async ({ page }) => {
    // Stage 1: Score is 0
    await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
    await page.getByTestId('increase-board-size-btn').click();
    await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();

    // Stage 2: Make a move to change the score
    await makeFirstMove(page);

    // Stage 3: Score is not 0
    await page.getByTestId('increase-board-size-btn').click();
    await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
    await expect(page.getByTestId('modal-window-title')).toHaveAttribute('data-i18n-key', 'modal.resetScoreTitle');
  });
});