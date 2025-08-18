import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Модальне вікно "Блискучий аналіз"', () => {

  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
    await setBoardSize(page, 3);
  });

  test('Повинно відображатися, коли режим блокування УВІМКНЕНО', { tag: ['@done', '@PNMM-1'] }, async ({ page }) => {
    await setBlockMode(page, BlockModeState.On);

    await makeMove(page, 'down', 1);
    await makeMove(page, 'up-right', 2);
    await makeMove(page, 'up-left', 1);

    // Задаємо параметри ходу комп'ютера, щоб він заблокував себе
    await page.getByTestId('test-mode-dir-btn-right').click();

    await makeMove(page, 'down', 1);

    // await page.waitForTimeout(17000);

    // Натискаємо на кнопку "Ходів немає"
    await page.waitForTimeout(5000);
    await page.getByTestId('no-moves-btn').click();
    
    // Перевіряємо, що модальне вікно з'явилося
    await expect(page.getByTestId('player-no-moves-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('player-no-moves-modal-title')).toHaveAttribute('data-i18n-key', 'modal.playerNoMovesTitle');
  });

  test('Повинно з`являтися вікно "Game Over", коли режим блокування ВИМКНЕНО', { tag: ['@done', '@PNMM-2'] }, async ({ page }) => {
    await setBlockMode(page, BlockModeState.On);
    await setBlockMode(page, BlockModeState.Off);

    await makeMove(page, 'down', 1);
    await makeMove(page, 'up-right', 2);
    await makeMove(page, 'up-left', 1);

    // Задаємо параметри ходу комп'ютера, щоб він заблокував себе
    await page.getByTestId('test-mode-dir-btn-right').click();

    await makeMove(page, 'down', 1);

    await setBlockMode(page, BlockModeState.On);
    // Натискаємо на кнопку "Ходів немає"
    await page.getByTestId('no-moves-btn').click();
    
    // Перевіряємо, що модальне вікно з'явилося
    await expect(page.getByTestId('game-over-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.gameOverTitle');
  });
});