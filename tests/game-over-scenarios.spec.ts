import { test, expect } from '@playwright/test';
import { startNewGame, setBoardSize, makeMove, expectScoreToBeZeroOrNegative, setBlockMode, BlockModeState } from './utils';

test.describe('Сценарії завершення гри', { tag: '@GOS' }, () => {
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
    // Встановлюємо невеликий розмір дошки, щоб легко вийти за межі
    await setBoardSize(page, 4);
  });

  test('Повинно з\'являтися вікно "Game Over", коли гравець виходить за межі дошки', { tag: ['@done', '@GOS-1'] }, async ({ page }) => {
    await test.step('Гравець робить хід за межі дошки', async () => {
      // Робимо хід, який гарантовано виходить за межі дошки 4x4
      // Стартова позиція зазвичай в центрі, тому будь-який хід на 2 клітинки буде за межами
      await makeMove(page, 'up', 2, false);
    });

    await test.step('Перевірка модального вікна "Гру завершено!"', async () => {
      await expect(page.getByTestId('game-over-modal')).toBeVisible();
      await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.trainingOverTitle');
    });

    await test.step('Перевірка, що рахунки нульові або від\'ємні', async () => {
      await expectScoreToBeZeroOrNegative(page, 'base-score-value');
      await expectScoreToBeZeroOrNegative(page, 'final-score-value');
    });
  });

  test('Повинно з\'являтися вікно "Game Over", коли гравець ходить на заблоковану клітинку', { tag: ['@done', '@GOS-2'] }, async ({ page }) => {

    await test.step('Гравець змінює розмір дошки та робить хід на заблоковану клітинку', async () => {
      await setBoardSize(page, 5);
      await setBlockMode(page, BlockModeState.On);
      await page.getByTestId('test-mode-dir-btn-up-right').click();
      await page.getByTestId('test-mode-move-dist-input').fill('3');
      await page.getByTestId('test-mode-set-move-dist-btn').click();
      await makeMove(page, 'down', 3);
      await page.getByTestId('test-mode-computer-move-random-btn').click();
      await makeMove(page, 'left', 3, false);
    });

    await test.step('Перевірка модального вікна "Гру завершено!"', async () => {
      await expect(page.getByTestId('game-over-modal')).toBeVisible();
      await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.trainingOverTitle');
    });
  });

  test('Повинно з\'являтися вікно "Game Over" після натискання кнопки "Забрати виграш"', { tag: ['@bug', '@GOS-3'] }, async ({ page }) => {

    await test.step('Гравець натискає "Забрати бали / Почати нову гру"', async () => {
      await page.getByTestId('test-mode-dir-btn-right').click();
      await page.getByTestId('test-mode-move-dist-input').fill('2');
      await page.getByTestId('test-mode-set-move-dist-btn').click();
      await makeMove(page, 'down-right', 1);
      await page.getByTestId('test-mode-computer-move-random-btn').click();
      await page.getByTestId('cash-out-btn').click();
    });

    await test.step('Перевірка модального вікна "Гру завершено!"', async () => {
      await expect(page.getByTestId('game-over-modal')).toBeVisible();
      await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.trainingOverTitle');
      // await expect(page.getByTestId('modal-content-reason')).toHaveAttribute('data-i18n-key', 'modal.gameOverReasonCashOut');
    });
  });
});