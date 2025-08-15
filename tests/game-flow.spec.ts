import { test, expect } from '@playwright/test';
import { startNewGame, makeFirstMove, GameMode } from './utils';

test.describe('Ігровий процес', () => {
  test('Користувач може почати гру проти комп\'ютера і зробити хід', { tag: ['@done', '@GF-1'] }, async ({ page }) => {
    await startNewGame(page);
    await makeFirstMove(page);
  });
});