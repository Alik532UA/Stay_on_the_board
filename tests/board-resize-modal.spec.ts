import { test, expect } from '@playwright/test';
import { startNewGame, makeFirstMove, GameMode } from './utils';

test.describe('Модальне вікно підтвердження зміни розміру дошки', { tag: '@BRM' }, () => {
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
  });

  test('1. Не повинно з`являтися, якщо рахунок 0', { tag: ['@done', '@BRM-1'] }, async ({ page }) => {
    await test.step('Перевірка, що модальне вікно не з\'являється при нульовому рахунку', async () => {
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
      await page.getByTestId('settings-expander-size-increase-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
    });
  });

  test('2. Повинно з`являтися, якщо рахунок не 0', { tag: ['@done', '@BRM-2'] }, async ({ page }) => {
    await test.step('Перевірка, що модальне вікно з\'являється, коли рахунок не нульовий', async () => {
      await makeFirstMove(page);
      await page.getByTestId('settings-expander-size-increase-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
      await expect(page.getByTestId('board-resize-confirm-modal-title')).toHaveAttribute('data-i18n-key', 'modal.resetScoreTitle');
    });
  });

  test('3. Спочатку не з`являється (рахунок 0), потім з`являється (рахунок не 0)', { tag: ['@done', '@BRM-3'] }, async ({ page }) => {
    await test.step('Етап 1: Рахунок 0, модальне вікно не з\'являється', async () => {
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
      await page.getByTestId('settings-expander-size-increase-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();
    });

    await test.step('Етап 2: Робимо хід, щоб змінити рахунок', async () => {
      await makeFirstMove(page);
    });

    await test.step('Етап 3: Рахунок не 0, модальне вікно з\'являється', async () => {
      await page.getByTestId('settings-expander-size-increase-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
      await expect(page.getByTestId('board-resize-confirm-modal-title')).toHaveAttribute('data-i18n-key', 'modal.resetScoreTitle');
    });
  });

  test('4. Кнопки "Так" та "Ні" працюють коректно і розмір дошки змінюється', { tag: ['@BRM-4'] }, async ({ page }) => {
    let initialCellCount: number;
    let initialScore: string | null;

    await test.step('Етап 1: Робимо хід, щоб рахунок не був 0', async () => {
      await makeFirstMove(page);
      initialCellCount = await page.getByTestId('board-cell').count();
      initialScore = await page.getByTestId('score-value').textContent();
    });

    await test.step('Етап 2: Натискаємо "Ні" і перевіряємо, що вікно закрилося, а дані не змінилися', async () => {
      await page.getByTestId('settings-expander-size-increase-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
      await page.getByTestId('board-resize-cancel-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();

      const currentCellCount = await page.getByTestId('board-cell').count();
      const currentScore = await page.getByTestId('score-value').textContent();

      expect(currentCellCount).toBe(initialCellCount);
      expect(currentScore).toBe(initialScore);
    });

    await test.step('Етап 3: Натискаємо "Так" і перевіряємо, що розмір дошки змінився', async () => {
      await page.getByTestId('settings-expander-size-increase-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).toBeVisible();
      await page.getByTestId('board-resize-confirm-btn').click();
      await expect(page.getByTestId('board-resize-confirm-modal')).not.toBeVisible();

      const finalCellCount = await page.getByTestId('board-cell').count();
      expect(finalCellCount).toBeGreaterThan(initialCellCount);
    });
  });
});