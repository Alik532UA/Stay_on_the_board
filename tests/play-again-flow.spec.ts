import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Кнопка "Грати ще раз"', () => {

  test('Повинна починати нову гру після модального вікна "Суперник у пастці"', { tag: ['@done', '@PAG-1'] }, async ({ page }) => {
    await startNewGame(page);
    await setBoardSize(page, 2);
    await setBlockMode(page, BlockModeState.On);

    await makeMove(page, 'right', 1);
    await makeMove(page, 'left', 1, false);
    
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Натискаємо "Завершити з бонусом"
    await page.getByTestId('finish-game-with-bonus-btn').click();
    await expect(page.getByTestId('game-over-modal')).toBeVisible();

    // Натискаємо "Грати ще раз"
    await page.getByTestId('play-again-btn').click();

    // Перевіряємо, що всі модальні вікна закриті і гра почалася
    await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();
    await expect(page.getByTestId('game-over-modal')).not.toBeVisible();
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('Повинна починати нову гру після модального вікна "Блискучий аналіз"', { tag: ['@done', '@PAG-2'] }, async ({ page }) => {
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

    // Натискаємо "Завершити з бонусом"
    await page.getByTestId('finish-game-with-bonus-btn').click();
    await expect(page.getByTestId('game-over-modal')).toBeVisible();

    // Натискаємо "Грати ще раз"
    await page.getByTestId('play-again-btn').click();

    // Перевіряємо, що всі модальні вікна закриті і гра почалася
    await expect(page.getByTestId('player-no-moves-modal')).not.toBeVisible();
    await expect(page.getByTestId('game-over-modal')).not.toBeVisible();
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

});