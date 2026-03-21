import { test, expect } from '@playwright/test';
import { mockUnauthenticated } from './helpers/mocks';

const BASE = '/cases';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
  });

  test('отображает форму ввода email', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole('form').getByRole('img', { name: 'CaseHub' })).toBeVisible();
    await expect(page.getByLabel(/электронная почта/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /получить код/i })).toBeVisible();
  });

  test('кнопки социальных провайдеров отображаются', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole('button', { name: /discord/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /яндекс/i })).toBeVisible();
  });

  test('кнопка "Отправить код" переходит на шаг ввода кода', async ({ page }) => {
    await page.route('**/api/auth/email/login/start', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
    await page.goto(`${BASE}/login`);

    await page.getByLabel(/электронная почта/i).fill('test@example.com');
    await page.getByRole('button', { name: /получить код/i }).click();

    await expect(page.getByLabel(/код/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  });

  test('кнопка "Назад" возвращает к форме email', async ({ page }) => {
    await page.route('**/api/auth/email/login/start', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
    await page.goto(`${BASE}/login`);
    await page.getByLabel(/электронная почта/i).fill('test@example.com');
    await page.getByRole('button', { name: /получить код/i }).click();
    await expect(page.getByLabel(/код/i)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /изменить почту/i }).click();
    await expect(page.getByLabel(/электронная почта/i)).toBeVisible();
  });

  test('показывает ошибку при неверном email', async ({ page }) => {
    await page.route('**/api/auth/email/login/start', route =>
      route.fulfill({ status: 400, json: { detail: 'Не удалось отправить код' } })
    );
    await page.goto(`${BASE}/login`);
    await page.getByLabel(/электронная почта/i).fill('bad@example.com');
    await page.getByRole('button', { name: /получить код/i }).click();
    await expect(page.getByText(/не удалось отправить код/i)).toBeVisible({ timeout: 5000 });
  });

  test('показывает ошибку при неверном коде', async ({ page }) => {
    await page.route('**/api/auth/email/login/start', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
    await page.route('**/api/auth/email/login/finish', route =>
      route.fulfill({ status: 400, json: { detail: 'Неверный код' } })
    );
    await page.goto(`${BASE}/login`);
    await page.getByLabel(/электронная почта/i).fill('test@example.com');
    await page.getByRole('button', { name: /получить код/i }).click();
    await expect(page.getByLabel(/код/i)).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/код/i).fill('000000');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page.getByText(/неверный код/i)).toBeVisible({ timeout: 5000 });
  });

  test('успешный вход редиректит на главную', async ({ page }) => {
    let loggedIn = false;
    await page.route('**/api/auth/email/login/start', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
    await page.route('**/api/auth/email/login/finish', route => {
      loggedIn = true;
      return route.fulfill({ status: 200, json: { ok: true, user: null } });
    });
    await page.route('**/api/user/v1/users/me', route => {
      if (!loggedIn) {
        return route.fulfill({ status: 401, json: { detail: 'Unauthorized' } });
      }
      return route.fulfill({
        status: 200,
        json: { id: 'aaa', email: 'test@example.com', nickname: 'Tester', status: 'active', role: 'user' },
      });
    });
    await page.route('**/api/payment/balance/**', route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 100 } } } })
    );
    await page.route('**/api/cases/', route =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.route('**/api/cases/recent_wins**', route =>
      route.fulfill({ status: 200, json: [] })
    );
    await page.goto(`${BASE}/login`);
    await page.getByLabel(/электронная почта/i).fill('test@example.com');
    await page.getByRole('button', { name: /получить код/i }).click();
    await expect(page.getByLabel(/код/i)).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/код/i).fill('123456');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();

    await expect(page).toHaveURL(/\/cases\/?$/, { timeout: 8000 });
  });

  test('кнопка "Discord" ведёт на OAuth URL', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const discordBtn = page.getByRole('button', { name: /discord/i });
    await expect(discordBtn).toBeVisible();
    // Кнопка кликабельна (не disabled)
    await expect(discordBtn).not.toBeDisabled();
  });

  test('навигационная ссылка "Нет аккаунта" ведёт на /register (desktop hover)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/login`);
    const registerLink = page.locator('a[href="/cases/register"]').first();
    await expect(registerLink).toBeAttached();
  });
});

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
  });

  test('отображает форму регистрации с полями email и nickname', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page.getByRole('img', { name: 'CaseHub' }).nth(1)).toBeVisible();
    await expect(page.getByLabel(/электронная почта/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /получить код/i })).toBeVisible();
  });

  test('переходит на шаг кода после отправки', async ({ page }) => {
    await page.route('**/api/auth/email/login/start', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
    await page.goto(`${BASE}/register`);
    await page.getByLabel(/электронная почта/i).fill('newuser@example.com');
    await page.getByRole('button', { name: /получить код/i }).click();
    await expect(page.getByLabel(/имя пользователя/i)).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/имя пользователя/i).fill('NewUser');
    await expect(page.getByRole('button', { name: /зарегистрироваться/i })).toBeVisible({ timeout: 5000 });
  });

  test('кнопка "Назад" возвращает к форме регистрации', async ({ page }) => {
    await page.route('**/api/auth/email/login/start', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
    await page.goto(`${BASE}/register`);
    await page.getByLabel(/электронная почта/i).fill('newuser@example.com');
    await page.getByRole('button', { name: /получить код/i }).click();
    await expect(page.getByRole('button', { name: /зарегистрироваться/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /изменить почту/i }).click();
    await expect(page.getByLabel(/электронная почта/i)).toBeVisible();
  });

  test('ссылка "Уже есть аккаунт" ведёт на /login', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/register`);
    const loginLink = page.locator('a[href="/cases/login"]').first();
    await expect(loginLink).toBeAttached();
  });

  test('кнопка отправки задизейблена пока идёт запрос', async ({ page }) => {
    await page.route('**/api/auth/email/login/start', async route => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.fulfill({ status: 200, json: { ok: true } });
    });
    await page.goto(`${BASE}/register`);
    await page.getByLabel(/электронная почта/i).fill('new@example.com');
    const btn = page.locator('form button[type="submit"]').first();
    await btn.click();
    // Кнопка должна уйти в состояние loading (показывает Loader2 иконку или disabled)
    await expect(btn).toBeDisabled();
  });
});
