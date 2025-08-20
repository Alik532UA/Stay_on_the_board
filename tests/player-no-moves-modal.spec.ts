import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Модальне вікно "Блискучий аналіз"', () => {

  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
    await setBoardSize(page, 3);
  });

  test('Повинно відображатися, коли режим блокування УВІМКНЕНО', { tag: ['@done', '@PNMM-1'] }, async ({ page }) => {
    await test.step('Налаштування гри з увімкненим режимом блокування', async () => {
      await setBlockMode(page, BlockModeState.On);
    });

    await test.step('Гравець та комп\'ютер роблять ходи, створюючи ситуацію без ходів для гравця', async () => {
      await makeMove(page, 'down', 1);
      await makeMove(page, 'up-right', 2);
      await makeMove(page, 'up-left', 1);
      await page.getByTestId('test-mode-dir-btn-right').click();
      await makeMove(page, 'down', 1);
    });

    await test.step('Гравець натискає "Ходів немає" та перевіряє модальне вікно', async () => {
      await page.getByTestId('no-moves-btn').click();
      await expect(page.getByTestId('player-no-moves-modal')).toBeVisible();
      await expect(page.getByTestId('player-no-moves-modal-title')).toHaveAttribute('data-i18n-key', 'modal.playerNoMovesTitle');
    });
  });

  test('Повинно з`являтися вікно "Game Over", коли режим блокування ВИМКНЕНО', { tag: ['@done', '@PNMM-2'] }, async ({ page }) => {
    await test.step('Налаштування гри з вимкненим режимом блокування', async () => {
      await setBlockMode(page, BlockModeState.On);
      await setBlockMode(page, BlockModeState.Off);
    });

    await test.step('Гравець та комп\'ютер роблять ходи', async () => {
      await makeMove(page, 'down', 1);
      await makeMove(page, 'up-right', 2);
      await makeMove(page, 'up-left', 1);
      await page.getByTestId('test-mode-dir-btn-right').click();
      await makeMove(page, 'down', 1);
    });

    await test.step('Гравець натискає "Ходів немає" та перевіряє модальне вікно "Гру завершено!"', async () => {
      await setBlockMode(page, BlockModeState.On);
      await page.getByTestId('no-moves-btn').click();
      await expect(page.getByTestId('game-over-modal')).toBeVisible();
      await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.gameOverTitle');
    });
  });
});