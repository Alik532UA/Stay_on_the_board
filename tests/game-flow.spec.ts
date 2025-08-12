import { test, expect } from '@playwright/test';

test.describe('Ігровий процес', () => {
  test('Користувач може почати гру проти комп\'ютера і зробити хід', async ({ page }) => {
    // 1. Зайти на головну сторінку
    await page.goto('/');

    // Вмикаємо Test Mode
    await page.locator('button:has-text("Test Mode")').click();

    // 2. Знайти і натиснути кнопку "Гра проти комп'ютера"
    // Playwright знайде кнопку за текстом, який бачить користувач
    await page.getByRole('button', { name: 'Гра проти комп\'ютера' }).click();

    // 3. Дочекатися завантаження ігрової сторінки
    // Перевіряємо, що на сторінці є панель керування
    // Додаємо крок для взаємодії з модальним вікном вибору режиму
    await page.getByRole('button', { name: 'Новачок' }).click();

    // Закриваємо модальне вікно "Поширені питання"
    await page.locator('button.modal-btn-generic:has-text("OK")').click();

    // Очікуємо завантаження сторінки після вибору режиму
    await page.waitForURL('**/game/vs-computer');

    // Перевіряємо, що на сторінці є панель керування
    await expect(page.locator('.direction-controls-panel')).toBeVisible();

    // 4. Зробити хід: натиснути стрілку "вправо", потім відстань "1"
    await page.locator('button.dir-btn:has-text("→")').click();
    await page.locator('button.dist-btn:has-text("1")').click();

    // 5. Натиснути кнопку "Підтвердити"
    await page.locator('button.confirm-btn').click();

    // 6. Перевірити результат
    // Наприклад, перевіримо, що в панелі рахунку з'явився рахунок > 0
    // (потрібно додати data-testid для надійності)
    const scorePanel = page.locator('.score-panel');
    await expect(scorePanel).not.toContainText('Рахунок: 0');
  });
});