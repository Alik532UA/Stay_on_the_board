import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('хепі флоу', () => {
  
  test.beforeEach(async ({ page }) => {
    // await startNewGame(page);
    // await setBoardSize(page, 2);
  });

  test('хепі флоу 1', { tag: ['@inProgress', '@HF-1'] }, async ({ page }) => {
    // Вмикаємо режим блокування клітинок
    await startNewGame(page);
    await setBoardSize(page, 3);
    
    await setBlockMode(page, BlockModeState.On);

    await makeMove(page, 'down', 1);
    await makeMove(page, 'up-right', 2);
    await makeMove(page, 'left', 1);

    // Задаємо параметри ходу комп'ютера, щоб ходив рандомно
    await page.getByTestId('test-mode-start-pos-random-btn').click();
    
    await makeMove(page, 'right', 1, false);

    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');

    // Натискаємо на кнопку "Переглянути запис"
    await page.getByTestId('watch-replay-computer-no-moves-btn').click();

    // Перевіряємо, що модальне вікно "replay.title" з'явилося
    await expect(page.getByTestId('replay-modal')).toBeVisible();

    // Закриваємо модальне вікно "replay.title"
    await page.getByTestId('modal-btn-modal.close').click();

    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Натискаємо на кнопку "Продовжити"
    await page.getByTestId('continue-game-no-moves-btn').click();

    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" НЕ з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();


  });
});