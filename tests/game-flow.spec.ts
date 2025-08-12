import { test, expect } from '@playwright/test';
import { startNewGame, makeFirstMove, GameMode } from './utils';

test.describe('[Done] Ігровий процес', () => {
  test('Користувач може почати гру проти комп\'ютера і зробити хід', async ({ page }) => {
    await startNewGame(page);
    await makeFirstMove(page);
  });
});