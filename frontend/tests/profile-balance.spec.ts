import { test, expect } from '@playwright/test';
import {
  mockAuthenticatedUser,
  mockCasesApi,
  mockInventoryApi,
  MOCK_USER,
  MOCK_BALANCE,
  MOCK_TRANSACTIONS,
} from './helpers/mocks';

const BASE = '/cases';

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockCasesApi(page);
    await mockInventoryApi(page);
    await page.route(`**/api/payment/balance/${MOCK_USER.id}`, route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: MOCK_BALANCE } } } })
    );
  });

  test('отображает страницу профиля с никнеймом', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await expect(page.getByRole('heading', { name: MOCK_USER.nickname })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(MOCK_USER.email)).toBeVisible();
  });

  test('вкладки "Обзор", "Инвентарь", "Настройки" переключаются', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await expect(page.getByRole('button', { name: /обзор/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /инвентарь/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /настройки/i })).toBeVisible();

    await page.getByRole('button', { name: /инвентарь/i }).click();
    await expect(page.getByRole('heading', { name: /инвентарь/i })).toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: /настройки/i }).click();
    await expect(page.getByRole('button', { name: /получить код/i })).toBeVisible();
  });

  test('вкладка "Обзор" показывает баланс', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await expect(page.getByText(MOCK_BALANCE.toLocaleString())).toBeVisible({ timeout: 8000 });
  });

  test('вкладка "Инвентарь" вызывает API и отображает предметы', async ({ page }) => {
    // Mock inventory to return 2 items
    await page.route('**/api/cases/inventory/**', route =>
      route.fulfill({ status: 200, json: { items: [
        { item_id: 'item-001', obtained_at: '2025-01-01T10:00:00Z' },
        { item_id: 'item-002', obtained_at: '2025-01-01T11:00:00Z' },
      ] } })
    );
    await page.goto(`${BASE}/profile`);
    await page.getByRole('button', { name: /инвентарь/i }).click();
    // Должны показаться предметы из MOCK_CASES lookup
    await expect(page.getByText('AK-47 | Redline')).toBeVisible({ timeout: 8000 });
  });

  test('кнопка "Продать" в инвентаре запрашивает подтверждение', async ({ page }) => {
    await page.route('**/api/cases/inventory/**', route =>
      route.fulfill({ status: 200, json: { items: [
        { item_id: 'item-001', obtained_at: '2025-01-01T10:00:00Z' },
      ] } })
    );
    await page.goto(`${BASE}/profile`);
    await page.getByRole('button', { name: /инвентарь/i }).click();
    await expect(page.getByText('AK-47 | Redline')).toBeVisible({ timeout: 8000 });
    // Нажать кнопку продать (первая кнопка с "продать")
    const sellButtons = page.getByRole('button', { name: /продать/i });
    await sellButtons.first().click();
    // Должно появиться подтверждение
    await expect(page.getByRole('button', { name: /подтвердить|да|confirm/i }).or(
      page.getByText(/вы уверены|подтвердить продажу/i)
    )).toBeVisible({ timeout: 3000 });
  });

  test('фильтр по редкости в инвентаре работает', async ({ page }) => {
    await page.route('**/api/cases/inventory/**', route =>
      route.fulfill({ status: 200, json: { items: [
        { item_id: 'item-001', obtained_at: '2025-01-01T10:00:00Z' }, // rare
        { item_id: 'item-002', obtained_at: '2025-01-01T11:00:00Z' }, // legendary
      ] } })
    );
    await page.goto(`${BASE}/profile`);
    await page.getByRole('button', { name: /инвентарь/i }).click();
    await expect(page.getByText('AK-47 | Redline')).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /фильтры/i }).click();
    // Нажать фильтр "Легендарное"
    await page.getByRole('button', { name: /легенд/i }).first().click();
    // AK (rare) должен скрыться, AWP (legendary) остаться
    await expect(page.getByText('AK-47 | Redline')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText('AWP | Dragon Lore')).toBeVisible();
  });

  test('вкладка "Настройки" — поле никнейма заполнено текущим значением', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await page.getByRole('button', { name: /настройки/i }).click();
    const nicknameInput = page.getByLabel(/никнейм/i);
    await expect(nicknameInput).toHaveValue(MOCK_USER.nickname, { timeout: 5000 });
  });

  test('кнопка "Сохранить" в настройках вызывает PATCH /users/me', async ({ page }) => {
    let patchCalled = false;
    await page.route('**/api/auth/profile/update/start', route => {
      patchCalled = true;
      return route.fulfill({ status: 200, json: { ok: true } });
    });
    await page.goto(`${BASE}/profile`);
    await page.getByRole('button', { name: /настройки/i }).click();
    const nicknameInput = page.getByLabel(/никнейм/i);
    await nicknameInput.clear();
    await nicknameInput.fill('NewNick');
    await page.getByRole('button', { name: /получить код/i }).click();
    // Should trigger the update flow
    await expect(page.getByLabel('Код подтверждения')).toBeVisible({ timeout: 5000 });
    expect(patchCalled).toBe(true);
  });
});

test.describe('Balance page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.route(`**/api/payment/balance/${MOCK_USER.id}`, route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: MOCK_BALANCE } } } })
    );
    await page.route(`**/api/payment/transaction/${MOCK_USER.id}`, route =>
      route.fulfill({ status: 200, json: MOCK_TRANSACTIONS })
    );
  });

  test('отображает текущий баланс', async ({ page }) => {
    await page.goto(`${BASE}/balance`);
    await expect(page.getByText('Текущий баланс')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('main').getByText(MOCK_BALANCE.toLocaleString())).toBeVisible();
  });

  test('отображает список транзакций', async ({ page }) => {
    await page.goto(`${BASE}/balance`);
    // Должна быть секция с транзакциями
    await expect(page.getByRole('heading', { name: /история транзакц/i })).toBeVisible({ timeout: 8000 });
  });

  test('кнопка "Ежедневный бонус" отображается', async ({ page }) => {
    await page.goto(`${BASE}/balance`);
    await expect(
      page.getByRole('button', { name: /получить бонус|daily bonus|ежедневн/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('кнопка "Ежедневный бонус" вызывает POST /bonus/daily и показывает сообщение', async ({ page }) => {
    await page.route('**/api/payment/bonus/daily', route =>
      route.fulfill({ status: 200, json: { success: true, message: 'Бонус получен! +100 CHC', amount: 100 } })
    );
    await page.goto(`${BASE}/balance`);
    const bonusBtn = page.getByRole('button', { name: /получить бонус|daily bonus|ежедневн/i });
    await expect(bonusBtn).toBeVisible({ timeout: 8000 });
    await bonusBtn.click();
    await expect(page.getByText(/бонус получен|100 CHC/i)).toBeVisible({ timeout: 5000 });
  });

  test('показывает сообщение если бонус уже получен сегодня', async ({ page }) => {
    await page.route('**/api/payment/bonus/daily', route =>
      route.fulfill({
        status: 200,
        json: { success: false, message: 'Бонус уже получен сегодня. Возвращайтесь через 24 часа', amount: 0 },
      })
    );
    await page.goto(`${BASE}/balance`);
    const bonusBtn = page.getByRole('button', { name: /получить бонус|daily bonus|ежедневн/i });
    await bonusBtn.click();
    await expect(page.getByText(/уже получен/i)).toBeVisible({ timeout: 5000 });
  });

  test('статистика: заработано и потрачено отображается', async ({ page }) => {
    await page.goto(`${BASE}/balance`);
    await expect(page.getByText(/заработано/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/потрачено/i)).toBeVisible();
  });

  test('ссылка "На главную" доступна', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/balance`);
    const homeLink = page.locator('a[href="/cases/"]').first();
    await expect(homeLink).toBeAttached({ timeout: 5000 });
  });
});
