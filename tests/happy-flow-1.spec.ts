import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('хепі флоу', () => {
  
  test.beforeEach(async ({ page }) => {
    // await startNewGame(page);
    // await setBoardSize(page, 2);
  });

  test('хепі флоу 1', { tag: ['@inProgress', '@HF-1'] }, async ({ page }) => {
    // test.setTimeout(1000 * 60 * 120); // 120 minutes
    await test.step('Початок гри та налаштування дошки', async () => {
      await startNewGame(page);
      await setBoardSize(page, 3);
      await setBlockMode(page, BlockModeState.On);
    });

    await test.step('Гравець робить перші ходи, щоб заблокувати комп\'ютер', async () => {
      await makeMove(page, 'down', 1);
      await makeMove(page, 'up-right', 2);
      await makeMove(page, 'left', 1);
    });

    await test.step('Комп\'ютер робить хід і потрапляє в пастку', async () => {
      await page.getByTestId('test-mode-computer-move-random-btn').click();
      await makeMove(page, 'right', 1, false);
    });

    await test.step('Перевірка модального вікна "Суперник у пастці!"', async () => {
      await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();
      await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');
    });

    await test.step('Перегляд та закриття запису гри', async () => {
      await page.getByTestId('watch-replay-computer-no-moves-btn').click();
      await expect(page.getByTestId('replay-modal')).toBeVisible();
      await page.getByTestId('modal-btn-modal.close').click();
    });

    await test.step('Повернення до модального вікна "Суперник у пастці!" та продовження гри', async () => {
      await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();
      await page.getByTestId('continue-game-no-moves-btn').click();
      await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();
    });

    await test.step('Гравець робить наступні ходи', async () => {
      await page.getByTestId('test-mode-dir-btn-left').click();
      await makeMove(page, 'up', 1);
      await page.getByTestId('test-mode-dir-btn-down-right').click();
      await makeMove(page, 'left', 1);
      await page.getByTestId('test-mode-dir-btn-right').click();
      await makeMove(page, 'up', 2);
    });

    await test.step('Комп\'ютер робить хід, гравець заявляє про відсутність ходів', async () => {
      await page.getByTestId('test-mode-computer-move-random-btn').click();
      await makeMove(page, 'left', 2);
      await page.getByTestId('no-moves-btn').click();
    });

    await test.step('Перевірка модального вікна "Блискучий аналіз!"', async () => {
      await expect(page.getByTestId('player-no-moves-modal')).toBeVisible();
      await expect(page.getByTestId('player-no-moves-modal-title')).toHaveAttribute('data-i18n-key', 'modal.playerNoMovesTitle');
    });

    await test.step('Перегляд та закриття запису гри після "Блискучого аналізу"', async () => {
      await page.getByTestId('watch-replay-human-no-moves-btn').click();
      await expect(page.getByTestId('replay-modal')).toBeVisible();
      await page.getByTestId('modal-btn-modal.close').click();
    });

    await test.step('Повернення до модального вікна "Блискучий аналіз!" та завершення гри з бонусом', async () => {
      await expect(page.getByTestId('player-no-moves-modal')).toBeVisible();
      // TODO: тут треба запам'ятати зміну яка в data-testid="final-score-value"
      await page.getByTestId('finish-game-with-bonus-btn').click();
    });

    await test.step('Перевірка модального вікна "Гру завершено!"', async () => {
      await expect(page.getByTestId('game-over-modal')).toBeVisible();
      await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.gameOverTitle');
      // TODO: тут треба перевірити що значення data-testid="final-score-value" більше ніж ми запам'ятали
    });

    await test.step('Перегляд фінального запису гри та початок нової гри', async () => {
      await page.getByTestId('watch-replay-btn').click();
      await expect(page.getByTestId('replay-modal')).toBeVisible();
      await expect(page.getByTestId('limit-path-toggle')).toBeVisible();
      await page.getByTestId('modal-btn-modal.close').click();
      await page.getByTestId('play-again-btn').click();
    });
  });
});