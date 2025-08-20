import { test, expect } from '@playwright/test';
import { startNewGame, setBoardSize, makeMove, expectScoreToBeZeroOrNegative } from './utils';

test.describe('Сценарії завершення гри', () => {
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
      await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.gameOverTitle');
      // TODO: Перевірити повідомлення про вихід за межі дошки, коли воно буде додано
      // const message = page.getByTestId('modal-content-reason');
      // await expect(message).toHaveAttribute('data-i18n-key', 'gameOverReasonOut');
    });

    await test.step('Перевірка, що рахунки нульові або від\'ємні', async () => {
      await expectScoreToBeZeroOrNegative(page, 'base-score-value');
      await expectScoreToBeZeroOrNegative(page, 'final-score-value');
    });
  });
});