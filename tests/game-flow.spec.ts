import { test, expect } from '@playwright/test';

test.describe('Ігровий процес', () => {
  test('Користувач може почати гру проти комп\'ютера і зробити хід', async ({ page }) => {
    // 1. Зайти на головну сторінку
    await page.goto('/');

    // Вмикаємо Test Mode
    await page.getByTestId('test-mode-btn').click();

    // 2. Знайти і натиснути кнопку "Гра проти комп'ютера"
    // Playwright знайде кнопку за текстом, який бачить користувач
    await page.getByTestId('play-vs-computer-btn').click();

    // 3. Дочекатися завантаження ігрової сторінки
    // Перевіряємо, що на сторінці є панель керування
    // Додаємо крок для взаємодії з модальним вікном вибору режиму
    await page.getByTestId('beginner-mode-btn').click();

    // Закриваємо модальне вікно "Поширені питання"
    await page.getByTestId('modal-btn-modal.ok').click();

    // Очікуємо завантаження сторінки після вибору режиму
    await page.waitForURL('**/game/vs-computer');

    // Перевіряємо, що на сторінці є панель керування
    await expect(page.locator('.direction-controls-panel')).toBeVisible();

    // 4. Зробити хід: натиснути стрілку "вправо", потім відстань "1"
    await page.getByTestId('dir-btn-right').click();
    await page.getByTestId('dist-btn-1').click();

    // 5. Натиснути кнопку "Підтвердити"
    await page.getByTestId('confirm-move-btn').click();

    // 6. Перевірити результат
    // Наприклад, перевіримо, що в панелі рахунку з'явився рахунок > 0
    // (потрібно додати data-testid для надійності)
    const scorePanel = page.locator('.score-panel');
    await expect(scorePanel).not.toContainText('Рахунок: 0');
  });
});