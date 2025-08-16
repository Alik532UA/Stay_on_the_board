import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Кнопка "Головне меню"', () => {

  test('Повинна повертати на головне меню після модального вікна "Суперник у пастці"', { tag: ['@done', '@MMF-1'] }, async ({ page }) => {
    await startNewGame(page);
    await setBoardSize(page, 2);
    await setBlockMode(page, BlockModeState.On);

    await makeMove(page, 'right', 1);
    await makeMove(page, 'left', 1, false);
    
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Натискаємо "Завершити з бонусом"
    await page.getByTestId('finish-game-with-bonus-btn').click();
    await expect(page.getByTestId('game-over-modal')).toBeVisible();

    // Натискаємо "Головне меню"
    await page.getByTestId('game-over-main-menu-btn').click();

    // Перевіряємо, що всі модальні вікна закриті і ми на головному меню
    await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();
    await expect(page.getByTestId('game-over-modal')).not.toBeVisible();
    await expect(page.getByTestId('main-menu-container')).toBeVisible();
  });

  test('Повинна повертати на головне меню після модального вікна "Блискучий аналіз"', { tag: ['@done', '@MMF-2'] }, async ({ page }) => {
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

    // Натискаємо "Головне меню"
    await page.getByTestId('game-over-main-menu-btn').click();

    // Перевіряємо, що всі модальні вікна закриті і ми на головному меню
    await expect(page.getByTestId('player-no-moves-modal')).not.toBeVisible();
    await expect(page.getByTestId('game-over-modal')).not.toBeVisible();
    await expect(page.getByTestId('main-menu-container')).toBeVisible();
  });

});