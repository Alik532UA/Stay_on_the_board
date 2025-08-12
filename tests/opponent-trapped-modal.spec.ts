import { test, expect } from '@playwright/test';

test.describe('Opponent Trapped Modal', () => {
  test('should display "Opponent Trapped!" modal', async ({ page }) => {
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

    // Встановлюємо розмір дошки 2x2, двічі натиснувши кнопку зменшення
    await page.getByTestId('decrease-board-size-btn').click();
    await page.getByTestId('decrease-board-size-btn').click();

    // Вмикаємо режим блокування клітинок
    await page.getByTestId('block-mode-toggle').click();

    // Хід комп'ютера
    // Припускаємо, що комп'ютер робить валідний хід.

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
    await page.waitForTimeout(7000);
    
    // Перевіряємо, що модальне вікно з'явилося
    await expect(page.getByTestId('opponent-trapped-modal')).toBeVisible();

    // Перевіряємо заголовок модального вікна
    await expect(page.getByTestId('opponent-trapped-modal-title')).toHaveText('Суперник у пастці!');
  });
});