import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Модальне вікно "Суперник у пастці"', { tag: '@OTM' }, () => {
  
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
    
  });

  test('Повинно відображатися, коли режим блокування УВІМКНЕНО (дошка 2x2)', { tag: ['@done', '@OTM-1-1'] }, async ({ page }) => {
    await setBoardSize(page, 2);
    // Вмикаємо режим блокування клітинок
    await setBlockMode(page, BlockModeState.On);

    await makeMove(page, 'right', 1);
    await makeMove(page, 'left', 1, false);
    
    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');
  });

  test('Повинно відображатися, коли режим блокування УВІМКНЕНО (дошка 3x3)', { tag: ['@done', '@OTM-1-2'] }, async ({ page }) => {
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
    
  });

  test('НЕ повинно відображатися, коли режим блокування ВИМКНЕНО', { tag: ['@done', '@OTM-2'] }, async ({ page }) => {
    await setBoardSize(page, 2);
    // Переконуємося, що режим блокування клітинок вимкнений
    await setBlockMode(page, BlockModeState.Off);

    await makeMove(page, 'right', 1);

    // Задаємо параметри ходу комп'ютера, щоб він заблокував себе
    await page.getByTestId('test-mode-dir-btn-right').click();
    // await page.getByTestId('test-mode-move-dist-input').fill('1');

    await makeMove(page, 'left', 1, false);
    
    // Перевіряємо, що модальне вікно "Суперник у пастці!"/"Opponent is Trapped!" НЕ з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();
  });
});