import { test, expect } from '@playwright/test';
import { startNewGame, setBoardSize, makeMove, expectScoreToBeZeroOrNegative } from './utils';

test.describe('Сценарії завершення гри', () => {
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
    // Встановлюємо невеликий розмір дошки, щоб легко вийти за межі
    await setBoardSize(page, 4);
  });

  test('Повинно з\'являтися вікно "Game Over", коли гравець виходить за межі дошки', async ({ page }) => {
    // Робимо хід, який гарантовано виходить за межі дошки 2x2
    // Стартова позиція зазвичай в центрі, тому будь-який хід на 2 клітинки буде за межами
    await makeMove(page, 'up', 2, false);

    // Перевіряємо, що модальне вікно "Game Over" з'явилося
    await expect(page.getByTestId('game-over-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна
    await expect(page.getByTestId('game-over-modal-title')).toHaveAttribute('data-i18n-key', 'modal.gameOverTitle');

    // Перевіряємо повідомлення про вихід за межі дошки
    await expect(page.getByTestId('modal-content-reason')).toHaveAttribute('data-i18n-key', 'modal.gameOverReasonOut');
    // const message = page.getByTestId('modal-content-reason');
    // await expect(message).toHaveAttribute('data-i18n-key', 'gameOverReasonOut');

    // Перевіряємо, що базовий рахунок менший або дорівнює 0
    await expectScoreToBeZeroOrNegative(page, 'base-score-value');

    // Перевіряємо, що фінальний рахунок менший або дорівнює 0
    await expectScoreToBeZeroOrNegative(page, 'final-score-value');
  });
});