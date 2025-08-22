import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Модальне вікно "Суперник у пастці"', { tag: '@OTM' }, () => {
  
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
    
  });

  test('Повинно відображатися, коли режим блокування УВІМКНЕНО (дошка 2x2)', { tag: ['@done', '@OTM-1-1'] }, async ({ page }) => {
    await test.step('Налаштування гри на дошці 2x2 з увімкненим режимом блокування', async () => {
      await setBoardSize(page, 2);
      await setBlockMode(page, BlockModeState.On);
    });

    await test.step('Гравець блокує комп\'ютера', async () => {
      await makeMove(page, 'right', 1);
      await makeMove(page, 'left', 1, false);
    });

    await test.step('Перевірка появи модального вікна "Суперник у пастці!"', async () => {
      await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();
      await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');
    });
  });

  test('Повинно відображатися, коли режим блокування УВІМКНЕНО (дошка 3x3)', { tag: ['@done', '@OTM-1-2'] }, async ({ page }) => {
    await test.step('Налаштування гри на дошці 3x3 з увімкненим режимом блокування', async () => {
      await setBoardSize(page, 3);
      await setBlockMode(page, BlockModeState.On);
    });

    await test.step('Гравець робить ходи, щоб заблокувати комп\'ютера', async () => {
      await makeMove(page, 'down', 1);
      await makeMove(page, 'up-right', 2);
      await makeMove(page, 'left', 1);
    });

    await test.step('Комп\'ютер робить випадковий хід і потрапляє в пастку', async () => {
      await page.getByTestId('test-mode-computer-move-random-btn').click();
      await makeMove(page, 'right', 1, false);
    });

    await test.step('Перевірка появи модального вікна "Суперник у пастці!"', async () => {
      await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();
      await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');
    });
  });

  test('НЕ повинно відображатися, коли режим блокування ВИМКНЕНО', { tag: ['@done', '@OTM-2'] }, async ({ page }) => {
    await test.step('Налаштування гри з вимкненим режимом блокування', async () => {
      await setBoardSize(page, 2);
      await setBlockMode(page, BlockModeState.Off);
    });

    await test.step('Гравець та комп\'ютер роблять ходи', async () => {
      await makeMove(page, 'right', 1);
      await page.getByTestId('test-mode-dir-btn-right').click();
      await makeMove(page, 'left', 1, false);
    });

    await test.step('Перевірка, що модальне вікно "Суперник у пастці!" не з\'явилося', async () => {
      await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();
    });
  });
});