import { type Page } from '@playwright/test';

export async function setBoardSize(page: Page, size: number) {
  await page.evaluate((newSize) => {
    const gameOrchestrator = (window as any).gameOrchestrator;
    if (gameOrchestrator) {
      gameOrchestrator.setBoardSize(newSize);
    } else {
      throw new Error('gameOrchestrator not found on window object');
    }
  }, size);
}