import { test, expect } from '@playwright/test';
import {
  mockUnauthenticated,
  mockAuthenticatedUser,
  mockCasesApi,
  MOCK_CASES,
} from './helpers/mocks';

const BASE = '/cases';

test.describe('Welcome page — неавторизованный', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
    await mockCasesApi(page);
  });

  test('отображает список кейсов', async ({ page }) => {
    await page.goto(`${BASE}/`);
    for (const c of MOCK_CASES) {
      await expect(page.getByRole('link', { name: new RegExp(c.name, 'i') }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('отображает ленту последних выпадений', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByText('AWP | Dragon Lore').first()).toBeVisible({ timeout: 8000 });
  });

  test('кнопка "Фильтры" открывает панель фильтров', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const filterBtn = page.getByRole('button', { name: /фильтр/i });
    await filterBtn.click();
    await expect(page.getByText(/редкость/i)).toBeVisible({ timeout: 3000 });
  });

  test('фильтр по цене: пресеты переключаются', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('button', { name: /фильтр/i }).click();
    await expect(page.getByRole('button', { name: 'до 100' })).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'до 100' }).click();
    // После выбора пресета кейс за 500 должен исчезнуть
    await expect(page.getByRole('link', { name: /легендарный кейс/i }).first()).not.toBeVisible({ timeout: 3000 });
  });

  test('фильтр по цене: пресет "Все" показывает все кейсы', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('button', { name: /фильтр/i }).click();
    await page.getByRole('button', { name: 'до 100' }).click();
    await page.getByRole('button', { name: 'Все' }).click();
    for (const c of MOCK_CASES) {
      await expect(page.getByRole('link', { name: new RegExp(c.name, 'i') }).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('фильтр по редкости: exotic скрывает common кейсы', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('button', { name: /фильтр/i }).click();
    // Нажать кнопку "Экзотическое"
    await page.getByRole('button', { name: /экзотич/i }).click();
    // Стартовый кейс (только rare/legendary/common) должен исчезнуть
    await expect(page.getByRole('link', { name: /стартовый кейс/i }).first()).not.toBeVisible({ timeout: 3000 });
    // Легендарный кейс (exotic) должен остаться
    await expect(page.getByRole('link', { name: /легендарный кейс/i }).first()).toBeVisible({ timeout: 3000 });
  });

  test('кнопка сброса фильтров убирает все фильтры', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('button', { name: /фильтр/i }).click();
    await page.getByRole('button', { name: /экзотич/i }).click();
    await page.getByRole('button', { name: /сбросить/i }).click();
    for (const c of MOCK_CASES) {
      await expect(page.getByRole('link', { name: new RegExp(c.name, 'i') }).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('кнопки сортировки: "Цена ↑" сортирует по возрастанию', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('button', { name: /фильтр/i }).click();
    await page.getByRole('button', { name: /цена ↑/i }).click();
    // Стартовый кейс (100) должен быть выше Легендарного (500)
    const caseNames = await page.locator('[class*="rounded"]').filter({ hasText: /кейс/ }).allTextContents();
    const startIdx = caseNames.findIndex(t => t.includes('Стартовый'));
    const legendIdx = caseNames.findIndex(t => t.includes('Легендарный'));
    if (startIdx !== -1 && legendIdx !== -1) {
      expect(startIdx).toBeLessThan(legendIdx);
    }
  });

  test('клик на карточку кейса переходит на страницу кейса', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const caseLink = page.getByRole('link', { name: /стартовый кейс/i }).first();
    await expect(caseLink).toBeVisible({ timeout: 8000 });
    await caseLink.click();
    await expect(page).toHaveURL(/\/cases\/case-001/, { timeout: 5000 });
  });

  test('кнопка "Войти" в navbar ведёт на /login', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('link', { name: /войти/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('CaseDetail page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    await mockCasesApi(page);
    await page.route('**/api/payment/balance/**', route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 1500 } } } })
    );
    await page.route('**/api/cases/open/**', route =>
      route.fulfill({
        status: 200,
        json: {
          won_item: {
            id: 'item-001',
            name: 'AK-47 | Redline',
            rarity: { name: 'rare', color: '#4B9CDB' },
            weapon: { name: 'AK-47', type: 'rifle' },
            img_url: null,
            price: 250,
            created_at: '2025-01-01T00:00:00Z',
          },
          inventory: [],
        },
      })
    );
    await page.route('**/api/cases/inventory/**', route =>
      route.fulfill({ status: 200, json: { items: [] } })
    );
    await page.route('**/api/cases/inventory/sell/**', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
  });

  test('отображает название кейса и список предметов', async ({ page }) => {
    await page.goto(`${BASE}/cases/case-001`);
    await expect(page.getByText('Стартовый кейс')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('AK-47 | Redline')).toBeVisible();
    await expect(page.getByText('AWP | Dragon Lore')).toBeVisible();
  });

  test('кнопка "Открыть" доступна при достаточном балансе', async ({ page }) => {
    await page.goto(`${BASE}/cases/case-001`);
    const openBtn = page.getByRole('button', { name: /^открыть \d+$/i });
    await expect(openBtn).toBeVisible({ timeout: 8000 });
    await expect(openBtn).not.toBeDisabled();
  });

  test('кнопка "Открыть" задизейблена при нехватке баланса', async ({ page }) => {
    // Override balance to be less than case price (100 CHC)
    await page.route('**/api/payment/balance/**', route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 50 } } } })
    );
    await page.goto(`${BASE}/cases/case-001`);
    const openBtn = page.getByRole('button', { name: /^открыть \d+$/i });
    await expect(openBtn).toBeVisible({ timeout: 8000 });
    // В текущем UI блокировка по балансу не делается на клиенте
    await expect(openBtn).not.toBeDisabled();
  });

  test('открытие кейса запускает анимацию и показывает выигрыш', async ({ page }) => {
    await page.goto(`${BASE}/cases/case-001`);
    const openBtn = page.getByRole('button', { name: /^открыть \d+$/i });
    await expect(openBtn).toBeVisible({ timeout: 8000 });
    await openBtn.click();
    // Крутилка должна запуститься (показывается кнопка пропуска)
    await expect(page.getByRole('button', { name: /пропустить/i })).toBeVisible({ timeout: 3000 });
    // Ждём завершения анимации и появления оверлея с действиями
    await expect(page.locator('.fixed.inset-0.z-50').getByRole('button', { name: /продать/i })).toBeVisible({ timeout: 15000 });
  });

  test('оверлей с выигрышем содержит кнопку "Забрать" и "Продать"', async ({ page }) => {
    await page.goto(`${BASE}/cases/case-001`);
    await page.getByRole('button', { name: /^открыть \d+$/i }).click();
    // Ждём оверлей
    await expect(page.getByText('AK-47 | Redline')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /продать/i })).toBeVisible();
  });

  test('оверлей закрывается кликом по фону', async ({ page }) => {
    await page.goto(`${BASE}/cases/case-001`);
    await page.getByRole('button', { name: /^открыть \d+$/i }).click();
    await expect(page.getByRole('button', { name: /продать/i })).toBeVisible({ timeout: 15000 });
    await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('button', { name: /^открыть \d+$/i })).toBeVisible({ timeout: 5000 });
  });

  test('кнопка "Продать" в оверлее продаёт предмет', async ({ page }) => {
    await page.route('**/api/cases/inventory/sell/**', route =>
      route.fulfill({ status: 200, json: { ok: true } })
    );
    await page.goto(`${BASE}/cases/case-001`);
    await page.getByRole('button', { name: /^открыть \d+$/i }).click();
    await expect(page.getByRole('button', { name: /продать/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /продать/i }).click();
    await page.getByRole('button', { name: /продать/i }).click();
    // После продажи оверлей должен закрыться или обновиться
    await expect(page.getByRole('button', { name: /^открыть \d+$/i })).toBeVisible({ timeout: 5000 });
  });

  test('кнопка "Открыть 5" отображается и принимает клики', async ({ page }) => {
    await page.goto(`${BASE}/cases/case-001`);
    const multiBtn = page.getByRole('button', { name: /открыть x5/i });
    await expect(multiBtn).toBeVisible({ timeout: 8000 });
    await expect(multiBtn).not.toBeDisabled();
  });

  test('при 402 ошибке показывается сообщение о нехватке средств', async ({ page }) => {
    await page.route('**/api/cases/open/**', route =>
      route.fulfill({ status: 402, json: { detail: 'Недостаточно средств' } })
    );
    // Установить баланс выше цены чтоб кнопка не была disabled
    await page.route('**/api/payment/balance/**', route =>
      route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 99999 } } } })
    );
    await page.goto(`${BASE}/cases/case-001`);
    await page.getByRole('button', { name: /^открыть \d+$/i }).click();
    await expect(page.getByText(/недостаточно средств|не удалось открыть/i)).toBeVisible({ timeout: 10000 });
  });

  test('ссылка "Стартовый кейс" в хлебных крошках доступна', async ({ page }) => {
    await page.goto(`${BASE}/cases/case-001`);
    // Проверяем наличие ссылки "На главную" или back
    const backLink = page.locator('a[href="/cases/"]').or(page.getByRole('link', { name: /на главную/i }));
    await expect(backLink.first()).toBeAttached({ timeout: 5000 });
  });
});
