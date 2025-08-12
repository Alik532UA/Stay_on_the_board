import { test, expect } from '@playwright/test';
import { setBoardSize } from './utils';

test.describe('[Done] Модальне вікно "Блискучий аналіз"', () => {
  test('Повинно відображатися модальне вікно "Блискучий аналіз!"', async ({ page }) => {
    // 1. Зайти на головну сторінку
    await page.goto('/');

    // Вмикаємо Test Mode
    await page.getByTestId('test-mode-btn').click();

    // 2. Знайти і натиснути кнопку "Гра проти комп'ютера"
    await page.getByTestId('play-vs-computer-btn').click();

    // 3. Дочекатися завантаження ігрової сторінки
    await page.getByTestId('beginner-mode-btn').click();

    // Закриваємо модальне вікно "Поширені питання"
    await page.getByTestId('modal-btn-modal.ok').click();

    // Очікуємо завантаження сторінки після вибору режиму
    await page.waitForURL('**/game/vs-computer');

    // Перевіряємо, що на сторінці є панель керування
    await expect(page.locator('.direction-controls-panel')).toBeVisible();

    // Встановлюємо розмір дошки 3x3
    await setBoardSize(page, 3);

    // Вмикаємо режим блокування клітинок
    await page.getByTestId('block-mode-toggle').click();

    // Робимо хід: вниз, дистанція 1
    await page.getByTestId('dir-btn-down').click();
    await page.getByTestId('dist-btn-1').click();
    await page.getByTestId('confirm-move-btn').click();
    await expect(page.locator('.control-btn.center-info.computer-move-display')).toBeVisible();

    // Робимо хід: по-діагоналі вверх вправо, дистанція 2
    await page.getByTestId('dir-btn-up-right').click();
    await page.getByTestId('dist-btn-2').click();
    await page.getByTestId('confirm-move-btn').click();
    await expect(page.locator('.control-btn.center-info.computer-move-display')).toBeVisible();

    // Робимо хід: по-діагоналі вверх вліво, дистанція 1
    await page.getByTestId('dir-btn-up-left').click();
    await page.getByTestId('dist-btn-1').click();
    await page.getByTestId('confirm-move-btn').click();
    await expect(page.locator('.control-btn.center-info.computer-move-display')).toBeVisible();

    // Задаємо параметри ходу комп'ютера, щоб він заблокував себе
    await page.getByTestId('test-mode-dir-btn-right').click();

    // Робимо хід: вниз, дистанція 1
    await page.getByTestId('dir-btn-down').click();
    await page.getByTestId('dist-btn-1').click();
    await page.getByTestId('confirm-move-btn').click();
    await expect(page.locator('.control-btn.center-info.computer-move-display')).toBeVisible();

    // Натискаємо на кнопку "Ходів немає"
    await page.getByTestId('no-moves-btn').click();
    
    // Перевіряємо, що модальне вікно з'явилося
    await expect(page.getByTestId('player-no-moves-modal')).toBeVisible();

    
    // Додаємо паузу 7 секунд
    // await page.waitForTimeout(7000);


    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.playerNoMovesTitle');
  });
});