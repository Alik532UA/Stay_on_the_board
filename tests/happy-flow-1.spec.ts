import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('хепі флоу', () => {
  
  test.beforeEach(async ({ page }) => {
    // await startNewGame(page);
    // await setBoardSize(page, 2);
  });

  test('хепі флоу 1', { tag: ['@inProgress', '@HF-1'] }, async ({ page }) => {
    test.setTimeout(1000 * 60 * 15); // 15 minutes
    // Вмикаємо режим блокування клітинок
    await startNewGame(page);

    //await page.waitForTimeout(2222);
    await setBoardSize(page, 3);
    //await page.waitForTimeout(2222);
    
    await setBlockMode(page, BlockModeState.On);
    //await page.waitForTimeout(2222);
    await makeMove(page, 'down', 1);
    //await page.waitForTimeout(2222);
    await makeMove(page, 'up-right', 2);
    //await page.waitForTimeout(2222);
    await makeMove(page, 'left', 1);

    // Задаємо параметри ходу комп'ютера, щоб ходив рандомно
    //await page.waitForTimeout(2222);

    await page.getByTestId('test-mode-computer-move-random-btn').click();

    //await page.waitForTimeout(2222);
    await page.waitForTimeout(7777777);

    await makeMove(page, 'right', 1, false);
    //await page.waitForTimeout(2222);

    await page.waitForTimeout(7777777);

    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();
    //await page.waitForTimeout(2222);

    // await page.waitForTimeout(7777777);

    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');
    //await page.waitForTimeout(2222);

    // Натискаємо на кнопку "Переглянути запис"
    await page.getByTestId('watch-replay-computer-no-moves-btn').click();
    //await page.waitForTimeout(2222);

    // Перевіряємо, що модальне вікно "replay.title" з'явилося
    await expect(page.getByTestId('replay-modal')).toBeVisible();
    //await page.waitForTimeout(2222);

    // Закриваємо модальне вікно "replay.title"
    await page.getByTestId('modal-btn-modal.close').click();
    //await page.waitForTimeout(2222);

    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();
    //await page.waitForTimeout(2222);

    // await page.waitForTimeout(7777);

    // await page.waitForTimeout(7777777);

    // Натискаємо на кнопку "Продовжити"
    await page.getByTestId('continue-game-no-moves-btn').click();
    
    // await page.waitForTimeout(7777777);

    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" НЕ з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();


  });
});