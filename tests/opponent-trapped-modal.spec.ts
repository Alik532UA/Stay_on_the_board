import { test, expect } from '@playwright/test';
import { setBoardSize, startNewGame, setBlockMode, BlockModeState, makeMove } from './utils';

test.describe('Модальне вікно "Суперник у пастці"', () => {
  
  test.beforeEach(async ({ page }) => {
    await startNewGame(page);
    await setBoardSize(page, 2);
  });

  test('Повинно відображатися, коли режим блокування УВІМКНЕНО', { tag: '@bug' }, async ({ page }) => {
    // Вмикаємо режим блокування клітинок
    await setBlockMode(page, BlockModeState.On);

    await makeMove(page, 'right', 1);
    await makeMove(page, 'left', 1, false);
    
    // Перевіряємо, що модальне вікно з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');
  });

  test('НЕ повинно відображатися, коли режим блокування ВИМКНЕНО', { tag: '@done' }, async ({ page }) => {
    // Переконуємося, що режим блокування клітинок вимкнений
    await setBlockMode(page, BlockModeState.Off);

    await makeMove(page, 'right', 1);

    // Задаємо параметри ходу комп'ютера, щоб він заблокував себе
    await page.evaluate(() => {
      const testModeStore = (window as any).testModeStore;
      if (testModeStore) {
        // @ts-ignore
        testModeStore.update(state => ({
          ...state,
          computerMoveMode: 'manual',
          manualComputerMove: { direction: 'right', distance: 1 }
        }));
      }
    });

    await makeMove(page, 'left', 1, false);
    
    // Перевіряємо, що модальне вікно НЕ з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).not.toBeVisible();
  });
});