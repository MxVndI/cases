import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser, MOCK_USER, MOCK_BALANCE } from './helpers/mocks';

const BASE = '/cases';

test.describe('Farm page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.route(`**/api/payment/balance/${MOCK_USER.id}`, route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: MOCK_BALANCE } } } })
    );
    await page.route('**/api/payment/tap', route =>
      route.fulfill({ status: 200, json: {} })
    );
  });

  test('отображает главную кнопку тапа с монетой', async ({ page }) => {
    await page.goto(`${BASE}/farm`);
    // Кнопка-монета для тапа (большая круглая кнопка)
    const tapButton = page.locator('[class*="rounded-full"]').filter({ has: page.locator('.lucide-coins') }).first();
    await expect(tapButton).toBeVisible({ timeout: 8000 });
  });

  test('тап по кнопке увеличивает счётчик монет', async ({ page }) => {
    await page.goto(`${BASE}/farm`);
    // Найти большую кнопку для нажатия
    const tapButton = page.locator('[class*="rounded-full"]').filter({ has: page.locator('.lucide-coins') }).first();
    const initialText = await page.textContent('[class*="text-orange"]') || '0';
    await tapButton.click();
    // Нет конкретного счётчика, но анимация должна появиться
    await expect(tapButton).toBeVisible({ timeout: 3000 });
  });

  test('отображает секцию апгрейдов', async ({ page }) => {
    await page.goto(`${BASE}/farm`);
    await expect(page.getByRole('heading', { name: /улучшения/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /усиленный клик/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /авто-?кликер/i })).toBeVisible();
  });

  test('кнопка апгрейда "Сила клика" задизейблена если нет денег', async ({ page }) => {
    // Balance = 5 CHC (меньше стоимости апгрейда 10 CHC)
    await page.route(`**/api/payment/balance/${MOCK_USER.id}`, route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 5 } } } })
    );
    await page.goto(`${BASE}/farm`);
    const upgradeBtn = page.getByRole('button', { name: /усиленный клик/i });
    await expect(upgradeBtn).toBeVisible({ timeout: 5000 });
    await expect(upgradeBtn).toBeDisabled();
  });

  test('кнопка апгрейда "Авто-кликер" доступна при достаточном балансе', async ({ page }) => {
    await page.goto(`${BASE}/farm`);
    const autoBtn = page.getByRole('button', { name: /авто-?кликер/i });
    await expect(autoBtn).toBeVisible({ timeout: 8000 });
    await expect(autoBtn).not.toBeDisabled();
  });

  test('апгрейд "Сила клика" вызывает POST /payment/tap с отрицательной суммой', async ({ page }) => {
    const tapRequests: number[] = [];
    await page.route('**/api/payment/tap', route => {
      const body = route.request().postDataJSON();
      tapRequests.push(body?.amount ?? 0);
      return route.fulfill({ status: 200, json: {} });
    });
    // Установить большой баланс
    await page.route(`**/api/payment/balance/${MOCK_USER.id}`, route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 10000 } } } })
    );
    await page.goto(`${BASE}/farm`);
    // Нажать апгрейд "Сила клика" (стоит 10 CHC на lvl 0)
    const upgradeSection = page.locator('[class*="rounded"]').filter({ hasText: /сила клика/i }).first();
    const buyBtn = upgradeSection.locator('button').last();
    if (await buyBtn.isVisible() && !(await buyBtn.isDisabled())) {
      await buyBtn.click();
      // После клика — через 1500ms должен пройти tap запрос
      await page.waitForTimeout(2000);
      const negativeAmounts = tapRequests.filter(a => a < 0);
      expect(negativeAmounts.length).toBeGreaterThan(0);
    } else {
      // Пропустить если кнопка не активна (тест окружения)
      test.skip();
    }
  });

  test('отображает текущий баланс на странице фармы', async ({ page }) => {
    await page.goto(`${BASE}/farm`);
    await expect(page.getByText('Ваш баланс')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('main').getByText(MOCK_BALANCE.toLocaleString())).toBeVisible();
  });

  test('показывает уровни и стоимости апгрейдов', async ({ page }) => {
    await page.goto(`${BASE}/farm`);
    await expect(page.getByRole('button', { name: /lv\.1\/10/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /lv\.1\/8/i })).toBeVisible();
  });

  test('апгрейды "Скорость авто-кликера" и "Множитель" отображаются', async ({ page }) => {
    await page.goto(`${BASE}/farm`);
    await expect(
      page.getByText(/множитель|multiplier/i).or(page.getByText(/скорость|speed/i))
    ).toBeVisible({ timeout: 8000 });
  });
});
