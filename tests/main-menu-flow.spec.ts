import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Кнопка "Головне меню"', () => {

  test('Повинна повертати на головне меню після модального вікна "Суперник у пастці"', { tag: ['@done', '@MMF-1'] }, async ({ page }) => {
    await test.step('Налаштування гри та доведення до стану "Суперник у пастці"', async () => {
      await startNewGame(page);
      await setBoardSize(page, 2);
      await setBlockMode(page, BlockModeState.On);
      await makeMove(page, 'right', 1);
      await page.getByTestId('test-mode-computer-move-random-btn').click();
      await makeMove(page, 'left', 1, false);
      await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();
    });

    await test.step('Завершення гри та перехід до головного меню', async () => {
      await page.getByTestId('finish-game-with-bonus-btn').click();
      await expect(page.getByTestId('game-over-modal')).toBeVisible();
      await page.getByTestId('game-over-main-menu-btn').click();
    });

    await test.step('Перевірка, що всі модальні вікна закриті і відображається головне меню', async () => {
      await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();
      await expect(page.getByTestId('game-over-modal')).not.toBeVisible();
      await expect(page.getByTestId('center-container')).toBeVisible();
    });
  });

  test('Повинна повертати на головне меню після модального вікна "Блискучий аналіз"', { tag: ['@done', '@MMF-2'] }, async ({ page }) => {
    await test.step('Налаштування гри та доведення до стану "Блискучий аналіз"', async () => {
      await startNewGame(page);
      await setBoardSize(page, 3);
      await setBlockMode(page, BlockModeState.On);
      await makeMove(page, 'down', 1);
      await makeMove(page, 'up-right', 2);
      await makeMove(page, 'up-left', 1);
      await page.getByTestId('test-mode-dir-btn-right').click();
      await makeMove(page, 'down', 1);
      await page.getByTestId('no-moves-btn').click();
      await expect(page.getByTestId('player-no-moves-modal')).toBeVisible();
    });

    await test.step('Завершення гри та перехід до головного меню', async () => {
      await page.getByTestId('finish-game-with-bonus-btn').click();
      await expect(page.getByTestId('game-over-modal')).toBeVisible();
      await page.getByTestId('game-over-main-menu-btn').click();
    });

    await test.step('Перевірка, що всі модальні вікна закриті і відображається головне меню', async () => {
      await expect(page.getByTestId('player-no-moves-modal')).not.toBeVisible();
      await expect(page.getByTestId('game-over-modal')).not.toBeVisible();
      await expect(page.getByTestId('center-container')).toBeVisible();
    });
  });

});