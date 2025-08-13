    // Додаємо паузу 7 секунд
    // await page.waitForTimeout(7000);

import { test, expect, type Page } from '@playwright/test';

export async function setBoardSize(page: Page, size: number) {
  await page.evaluate((newSize) => {
    const userActionService = (window as any).userActionService;
    if (userActionService) {
      userActionService.changeBoardSize(newSize);
    } else {
      throw new Error('userActionService not found on window object');
    }
  }, size);
}

export enum GameMode {
  Beginner = 'beginner-mode-btn',
  Experienced = 'experienced-mode-btn',
  Pro = 'pro-mode-btn',
}

export async function startNewGame(page: Page, mode: GameMode = GameMode.Beginner) {
  await page.goto('/');
  await page.getByTestId('test-mode-btn').click();
  await page.getByTestId('play-vs-computer-btn').click();

  await page.getByTestId(mode).click();

  if (mode === GameMode.Beginner) {
    await page.getByTestId('modal-btn-modal.ok').click();
  }

  await page.waitForURL('**/game/vs-computer');
  await expect(page.locator('.direction-controls-panel')).toBeVisible();
}

export enum BlockModeState {
  Toggle,
  On,
  Off,
}

export async function setBlockMode(page: Page, state: BlockModeState) {
  const toggle = page.getByTestId('block-mode-toggle');
  const isChecked = await toggle.evaluate(node => node.classList.contains('active'));

  switch (state) {
    case BlockModeState.Toggle:
      await toggle.click();
      break;
    case BlockModeState.On:
      if (!isChecked) {
        await toggle.click();
      }
      break;
    case BlockModeState.Off:
      if (isChecked) {
        await toggle.click();
      }
      break;
  }
}

export async function makeMove(page: Page, direction: string, distance: number, expectComputerMove = true) {
  await page.getByTestId(`dir-btn-${direction}`).click();
  await page.getByTestId(`dist-btn-${distance}`).click();
  await page.getByTestId('confirm-move-btn').click();
  if (expectComputerMove) {
    await expect(page.locator('.control-btn.center-info.computer-move-display')).toBeVisible();
  }
}

export async function makeFirstMove(page: Page) {
  // A specific instance of makeMove for convenience
  await makeMove(page, 'right', 1, false);
  const scorePanel = page.locator('.score-panel');
  await expect(scorePanel).not.toContainText('Рахунок: 0');
}