import { test, expect } from '@playwright/test';
import {
  mockAuthenticatedUser,
  mockUnauthenticated,
  mockCasesApi,
  MOCK_USER,
  MOCK_BALANCE,
  MOCK_ADMIN,
} from './helpers/mocks';

const BASE = '/cases';

test.describe('Navbar — неавторизованный', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
    await mockCasesApi(page);
  });

  test('показывает кнопку "Войти" для незалогиненного', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByRole('link', { name: /войти/i })).toBeVisible({ timeout: 8000 });
  });

  test('кнопка "Войти" ведёт на страницу входа', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('link', { name: /войти/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('логотип CaseHub ведёт на главную', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await mockUnauthenticated(page);
    const logo = page.getByRole('link').filter({ has: page.getByRole('img', { name: 'CaseHub' }) });
    await logo.click();
    await expect(page).toHaveURL(/\/cases\/?$/, { timeout: 5000 });
  });
});

test.describe('Navbar — авторизованный пользователь', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockCasesApi(page);
    await page.route(`**/api/payment/balance/${MOCK_USER.id}`, route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: MOCK_BALANCE } } } })
    );
  });

  test('показывает никнейм и баланс', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/`);
    await expect(page.getByText(MOCK_USER.nickname)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(MOCK_BALANCE.toLocaleString())).toBeVisible();
  });

  test('нет кнопки "Войти" у авторизованного', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByRole('link', { name: /войти/i })).not.toBeVisible({ timeout: 3000 });
  });

  test('клик на никнейм открывает dropdown меню', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByText(MOCK_USER.nickname)).toBeVisible({ timeout: 8000 });
    await page.getByText(MOCK_USER.nickname).click();
    await expect(page.getByRole('menuitem', { name: /профиль/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('menuitem', { name: /выйти/i })).toBeVisible();
  });

  test('"Профиль" в dropdown ведёт на /profile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByText(MOCK_USER.nickname).click();
    await page.getByRole('menuitem', { name: /профиль/i }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 5000 });
  });

  test('"Выйти" вызывает logout и редиректит', async ({ page }) => {
    await page.route('**/api/auth/logout', route =>
      route.fulfill({ status: 200, json: {} })
    );
    // После logout — getMe возвращает 401
    await page.goto(`${BASE}/`);
    await page.getByText(MOCK_USER.nickname).click();
    await page.getByRole('menuitem', { name: /выйти/i }).click();
    // После выхода должна появиться кнопка "Войти"
    await expect(page.getByRole('link', { name: /войти/i })).toBeVisible({ timeout: 8000 });
  });

  test('клик на баланс ведёт на /balance', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/`);
    await expect(page.getByText(MOCK_BALANCE.toLocaleString())).toBeVisible({ timeout: 8000 });
    await page.getByText(MOCK_BALANCE.toLocaleString()).click();
    await expect(page).toHaveURL(/\/balance/, { timeout: 5000 });
  });
});

test.describe('Navbar — администратор', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page, MOCK_ADMIN);
    await mockCasesApi(page);
    await page.route(`**/api/payment/balance/${MOCK_ADMIN.id}`, route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 9999 } } } })
    );
  });

  test('показывает значок/ссылку "Админ" для admin', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/`);
    await expect(page.getByText(MOCK_ADMIN.nickname)).toBeVisible({ timeout: 8000 });
    // Бейдж или кнопка admin
    const adminBadge = page.getByRole('link', { name: /admin|администрат/i });
    await expect(adminBadge).toBeVisible({ timeout: 5000 });
  });
});

test.describe('UserProfile page', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
  });

  test('отображает страницу публичного профиля', async ({ page }) => {
    await page.goto(`${BASE}/user/SomeUser`);
    await expect(page.getByText('SomeUser')).toBeVisible({ timeout: 8000 });
  });

  test('показывает заглушку "будет доступен в будущих обновлениях"', async ({ page }) => {
    await page.goto(`${BASE}/user/AnyNick`);
    await expect(page.getByText(/будет доступен в будущих обновлениях/i)).toBeVisible({ timeout: 8000 });
  });

  test('ссылка "На главную" доступна', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/user/TestUser`);
    const homeLink = page.locator('a[href="/cases/"]').first();
    await expect(homeLink).toBeAttached({ timeout: 5000 });
  });
});

test.describe('Навигация (общая)', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
    await mockCasesApi(page);
  });

  test('несуществующий маршрут показывает 404', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent-page-xyz`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('404', { timeout: 8000 });
    await expect(page.getByText('Кейс не найден')).toBeVisible();
  });

  test('защищённые маршруты /profile редиректят на /login без авторизации', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('защищённые маршруты /admin редиректят на /login без авторизации', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
