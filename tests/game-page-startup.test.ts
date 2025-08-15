import { expect, test } from '@playwright/test';

test('Game page loads and renders correctly on direct navigation', { tag: '@GPS-1' }, async ({ page }) => {
  // Переходимо напряму на сторінку гри
  const response = await page.goto('/Stay_on_the_board/game/vs-computer');

  // 1. Перевіряємо, що сторінка завантажилася успішно (немає помилки 500)
  expect(response?.status()).toBe(200);

  // 2. Перевіряємо, що ігрова дошка існує і не порожня
  const gameBoard = page.locator('.game-board');
  await expect(gameBoard).toBeVisible();
  const boardCells = gameBoard.locator('.board-cell');
  await expect(await boardCells.count()).toBeGreaterThan(0);

  // 3. Перевіряємо, що текст перекладено (немає ключів)
  const gameInfo = page.locator('.game-info-widget');
  await expect(gameInfo).not.toContainText('gameBoard.gameInfo.firstMove');
  // await expect(gameInfo).toContainText('Ваш хід'); // Або будь-який інший очікуваний текст
});