// test.setTimeout(1000 * 60 * 120); // 120 minutes
// await page.waitForTimeout(7777777); // Додаємо паузу

import { test, expect, type Page, type Locator } from '@playwright/test';

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
  // НАВІЩО: Чекаємо, доки наш тестовий хук стане доступним на window.
  await page.waitForFunction(() => (window as any).toggleTestMode, null, { timeout: 10000 });

  // НАВІЩО: Викликаємо єдину, централізовану функцію для ввімкнення
  // тестового режиму. Це гарантує, що тест взаємодіє з додатком
  // через той самий SSoT, що й користувацький інтерфейс.
  await page.evaluate(() => {
    (window as any).toggleTestMode();
  });

  // Перевіряємо результат дії, а не імплементацію
  await expect(page.getByTestId('test-mode-widget-container')).toBeVisible();
}

// Починає нову гру
export async function startNewGame(page: Page, mode: GameMode = GameMode.Beginner) {
  await page.goto('/');
  await enableTestMode(page);
  await page.getByTestId('play-btn').click();

  await page.getByTestId(mode).click();

  if (mode === GameMode.Beginner) {
    await page.getByTestId('faq-modal-modal.ok-btn').click();
  }

  await page.waitForURL('**/game/virtual-player');
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

  // НАВІЩО: Додаємо явне очікування, що кнопка стала активною (не має класу 'disabled').
  // Це робить тест більш надійним і переносить точку відмови ближче до реальної причини проблеми.
  await expect(page.getByTestId('confirm-move-btn')).not.toHaveClass(/disabled/);

  // Клікаємо на кнопку підтвердження ходу
  await page.getByTestId('confirm-move-btn').click();
  // Якщо очікується хід комп'ютера, перевіряємо його видимість
  if (expectComputerMove) {
    await expectVisibleWithModalCheck(page, page.locator('.control-btn.center-info.computer-move-display'));
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

/**
 * Покращена перевірка видимості, яка у випадку помилки додає інформацію про активне модальне вікно.
 * @param {Page} page - Поточна сторінка Playwright.
 * @param {Locator} locator - Локатор елемента, який потрібно перевірити.
 * @param {number} [timeout=5000] - Таймаут для очікування.
 */
export async function expectVisibleWithModalCheck(page: Page, locator: Locator, timeout = 5000) {
  try {
    await expect(locator).toBeVisible({ timeout });
  } catch (error) {
    // Якщо основна перевірка не вдалася, перевіряємо наявність модального вікна
    const modalContext = await page.evaluate(() => {
      // @ts-ignore
      const service = window.modalService;
      return service ? service.getCurrentModalContext() : null;
    });

    if (modalContext && modalContext.dataTestId) {
      const enhancedError = new Error(
        `Original expect(locator).toBeVisible() failed. Error: ${error.message}\n` +
        `[DIAGNOSTIC INFO] An unexpected modal with data-testid '${modalContext.dataTestId}' was visible at the time of failure.`
      );
      enhancedError.stack = error.stack;
      throw enhancedError;
    } else {
      // Якщо модального вікна немає, просто прокидаємо оригінальну помилку
      throw error;
    }
  }
}
