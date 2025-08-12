import { test, expect } from '@playwright/test';
import { setBoardSize } from './utils';

test.describe('[Done] Модальне вікно "Суперник у пастці"', () => {
  test('Повинно відображатися модальне вікно "Суперник у пастці!"', async ({ page }) => {
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

    // Встановлюємо розмір дошки 2x2
    await setBoardSize(page, 2);

    // Вмикаємо режим блокування клітинок
    await page.getByTestId('block-mode-toggle').click();

    // Робимо хід: вправо, дистанція 1
    await page.getByTestId('dir-btn-right').click();
    await page.getByTestId('dist-btn-1').click();

    // Підтверджуємо хід
    await page.getByTestId('confirm-move-btn').click();

    // Перевіряємо, що комп'ютер зробив хід
    await expect(page.locator('.control-btn.center-info.computer-move-display')).toBeVisible();

    // Робимо хід: вліво, дистанція 1
    await page.getByTestId('dir-btn-left').click();
    await page.getByTestId('dist-btn-1').click();

    // Підтверджуємо хід
    await page.getByTestId('confirm-move-btn').click();

    // Додаємо паузу 7 секунд
    // await page.waitForTimeout(7000);
    
    // Перевіряємо, що модальне вікно з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна за ключем локалізації
    await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveAttribute('data-i18n-key', 'modal.computerNoMovesTitle');
  });
});