import { test, expect } from '@playwright/test';
import { startNewGame, makeFirstMove, GameMode } from './utils';

test.describe('Ігровий процес', () => {
  test('Користувач може почати гру проти комп\'ютера і зробити хід', { tag: ['@done', '@GF-1'] }, async ({ page }) => {
    await test.step('Початок нової гри проти комп\'ютера', async () => {
      await startNewGame(page);
    });
    await test.step('Гравець робить перший хід', async () => {
      await makeFirstMove(page);
    });
  });
});