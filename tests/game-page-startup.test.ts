import { expect, test } from '@playwright/test';

test('Game page loads and renders correctly on direct navigation', { tag: ['@done', '@GPS-1'] } , async ({ page }) => {
  await test.step('Перехід на сторінку гри та перевірка статусу', async () => {
    const response = await page.goto('/Stay_on_the_board/game/training');
    expect(response?.status()).toBe(200);
  });

  await test.step('Перевірка видимості та наповненості ігрової дошки', async () => {
    const gameBoard = page.locator('.game-board');
    await expect(gameBoard).toBeVisible();
    const boardCells = gameBoard.locator('.board-cell');
    await expect(await boardCells.count()).toBeGreaterThan(0);
  });

  await test.step('Перевірка, що текст перекладено і не містить ключів локалізації', async () => {
    // ВИПРАВЛЕНО: Використовуємо унікальний data-testid замість неоднозначного класу.
    // Це робить тест надійним і стійким до змін у CSS.
    const gameInfo = page.getByTestId('game-info-panel');
    await expect(gameInfo).not.toContainText('gameBoard.gameInfo.firstMove');
    // TODO: Додати перевірку на конкретний перекладений текст, коли буде стабільна локалізація
    // await expect(gameInfo).toContainText('Ваш хід');
  });
});