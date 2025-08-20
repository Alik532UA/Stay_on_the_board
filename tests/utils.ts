// test.setTimeout(1000 * 60 * 120); // 120 minutes
// await page.waitForTimeout(7777777); // Додаємо паузу

import { test, expect, type Page } from '@playwright/test';

// Встановлює розмір ігрового поля
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

// Перелік режимів гри
export enum GameMode {
  Beginner = 'beginner-mode-btn',
}

// Вмикає тестовий режим
export async function enableTestMode(page: Page) {
  await page.waitForFunction(() => (window as any).settingsStore, null, { timeout: 10000 });
  await page.evaluate(() => {
    (window as any).settingsStore.updateSettings({ testMode: true });
    // Примусово встановлюємо значення в localStorage для надійності тесту
    localStorage.setItem('testMode', 'true');
  });
  // Перевіряємо, що значення дійсно встановлено
  await page.waitForFunction(() => localStorage.getItem('testMode') === 'true', null, {
    timeout: 5000,
  });
  await expect(page.getByTestId('test-mode-widget-container')).toBeVisible();
}

// Починає нову гру
export async function startNewGame(page: Page, mode: GameMode = GameMode.Beginner) {
  await page.goto('/');
  await enableTestMode(page);
  await page.getByTestId('vs-computer-btn').click();

  await page.getByTestId(mode).click();

  if (mode === GameMode.Beginner) {
    await page.getByTestId('modal-btn-modal.ok').click();
  }

  await page.waitForURL('**/game/vs-computer');
  await expect(page.locator('.direction-controls-panel')).toBeVisible();
}

// Перелік станів режиму блокування
export enum BlockModeState {
  Toggle,
  On,
  Off,
}

// Встановлює режим блокування
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

// Робить хід гравця
export async function makeMove(page: Page, direction: string, distance: number, expectComputerMove = true) {
  // Клікаємо на кнопку напрямку
  await page.getByTestId(`dir-btn-${direction}`).click();
  // Клікаємо на кнопку дистанції
  await page.getByTestId(`dist-btn-${distance}`).click();
  // Клікаємо на кнопку підтвердження ходу
  await page.getByTestId('confirm-move-btn').click();
  // Якщо очікується хід комп'ютера, перевіряємо його видимість
  if (expectComputerMove) {
    await expect(page.locator('.control-btn.center-info.computer-move-display')).toBeVisible();
  }
}

// Робить перший хід у грі
export async function makeFirstMove(page: Page) {
  // A specific instance of makeMove for convenience
  // Робимо хід
  await makeMove(page, 'right', 1, false);
  // Перевіряємо, що рахунок більший за 0
  await expectScoreToBePositive(page, 'score-value');
}

// Отримує числове значення рахунку за data-testid
export async function getScoreByTestId(page: Page, testId: string): Promise<number> {
  const scoreElement = page.getByTestId(testId);
  const scoreText = await scoreElement.innerText();
  return parseInt(scoreText, 10);
}

// Перевіряє, що рахунок за testId є додатнім
export async function expectScoreToBePositive(page: Page, testId: string) {
  const score = await getScoreByTestId(page, testId);
  expect(score).toBeGreaterThan(0);
}

// Перевіряє, що рахунок за testId є нульовим або від'ємним
export async function expectScoreToBeZeroOrNegative(page: Page, testId: string) {
  const score = await getScoreByTestId(page, testId);
  expect(score).toBeLessThanOrEqual(0);
}