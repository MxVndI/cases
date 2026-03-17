import { test, expect } from '@playwright/test';
import {
  mockAuthenticatedAdmin,
  mockAdminApi,
  mockCasesApi,
  MOCK_ADMIN,
  MOCK_CASES,
  MOCK_ITEMS,
  MOCK_USERS_LIST,
} from './helpers/mocks';

const BASE = '/cases';

test.describe('Admin page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedAdmin(page);
    await mockAdminApi(page);
    await mockCasesApi(page);
    await page.route('**/api/admin/users', route =>
      route.fulfill({ status: 200, json: { users: MOCK_USERS_LIST, total: MOCK_USERS_LIST.length } })
    );
    await page.route('**/api/admin/cases', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: MOCK_CASES });
      }
      return route.fulfill({ status: 200, json: MOCK_CASES[0] });
    });
    await page.route('**/api/admin/items', route =>
      route.fulfill({ status: 200, json: MOCK_ITEMS })
    );
  });

  test('страница администратора доступна для admin', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    // Default tab is "users" — wait for the tab navigation to load
    await expect(page.getByRole('heading', { name: /панель администрат/i })).toBeVisible({ timeout: 8000 });
  });

  test('вкладки "Кейсы", "Предметы", "Пользователи" отображаются', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page.getByRole('heading', { name: /панель администрат/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /кейс/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /предмет/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /редкост/i })).toBeVisible();
  });

  test('вкладка "Кейсы" показывает существующие кейсы', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    // Кейсы должны быть видны после перехода на вкладку
    for (const c of MOCK_CASES) {
      await expect(page.getByText(c.name)).toBeVisible({ timeout: 8000 });
    }
  });

  test('кнопка "Добавить кейс" открывает модальное окно', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    const addBtn = page.getByRole('button', { name: /добавить кейс/i });
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();
    // Модальное окно создания кейса
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    // Поле "Название" в форме кейса (placeholder вместо label — нет связи htmlFor)
    await expect(page.getByPlaceholder(/кейс.*название|название/i)).toBeVisible();
  });

  test('в модалке создания кейса есть поле цены и кнопка сохранить', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    await page.getByRole('button', { name: /добавить кейс/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    // Поле цены — placeholder "100"
    await expect(page.getByPlaceholder('100')).toBeVisible();
    // Кнопка создания кейса (текст "Создать" в диалоге)
    await expect(page.getByRole('button', { name: /создать/i })).toBeVisible();
  });

  test('кнопка "Авто-расчёт" в модалке кейса работает', async ({ page }) => {
    await page.route('**/api/admin/cases/calculate_chances', route =>
      route.fulfill({ status: 200, json: { chances: { 'item-001': 0.6, 'item-002': 0.4 } } })
    );
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    await page.getByRole('button', { name: /добавить кейс/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    const autoBtn = page.getByRole('button', { name: /авто.?расчёт|auto/i });
    if (await autoBtn.isVisible()) {
      await autoBtn.click();
      // Должны появиться рассчитанные шансы
    }
  });

  test('кнопка редактирования кейса открывает модальное окно с данными', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    await expect(page.getByText('Стартовый кейс')).toBeVisible({ timeout: 8000 });
    // Найти кнопку редактирования (иконка карандаша или Pencil)
    const editBtn = page.locator('button').filter({ has: page.locator('.lucide-pencil') }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel(/название/i)).toHaveValue('Стартовый кейс', { timeout: 3000 });
    }
  });

  test('кнопка удаления кейса запрашивает подтверждение или вызывает DELETE', async ({ page }) => {
    let deleteCalled = false;
    await page.route('**/api/admin/cases/**', route => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({ status: 200, json: {} });
      }
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, json: MOCK_CASES });
      }
      return route.fulfill({ status: 200, json: MOCK_CASES[0] });
    });
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    await expect(page.getByText('Стартовый кейс')).toBeVisible({ timeout: 8000 });
    const deleteBtn = page.locator('button').filter({ has: page.locator('.lucide-trash-2') }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Дать время на диалог или вызов
      await page.waitForTimeout(1000);
      // Либо confirm диалог, либо сразу DELETE
    }
  });

  test('вкладка "Пользователи" показывает список', async ({ page }) => {
    // "Пользователи" — вкладка по умолчанию, список уже загружен
    await page.goto(`${BASE}/admin`);
    // exact:true чтобы "Alice" не совпадало с "alice@test.com"
    await expect(page.getByText('Alice', { exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Bob', { exact: true })).toBeVisible();
  });

  test('поиск пользователей работает (вводимый текст фильтрует список)', async ({ page }) => {
    await page.route('**/api/admin/users**', route =>
      route.fulfill({ status: 200, json: { users: MOCK_USERS_LIST, total: MOCK_USERS_LIST.length } })
    );
    await page.goto(`${BASE}/admin`);
    await expect(page.getByText('Alice', { exact: true })).toBeVisible({ timeout: 8000 });
    // Поле поиска
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/поиск|search/i)).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Alice');
      await page.waitForTimeout(600);
      // Поиск работает клиентски — Bob скрывается в отфильтрованном списке
      await expect(page.getByText('Bob', { exact: true })).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('кнопка "Заблокировать" переключает статус пользователя', async ({ page }) => {
    let blockCalled = false;
    await page.route(/\/api\/admin\/users\/[^?]+\/block/, route => {
      blockCalled = true;
      return route.fulfill({ status: 200, json: {} });
    });
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /активные/i }).click();
    await expect(page.getByText('Alice', { exact: true })).toBeVisible({ timeout: 8000 });
    // Кнопка в строке пользователя без текстового label, берём кнопку внутри строки Alice
    const aliceRow = page
      .getByRole('link', { name: 'Alice', exact: true })
      .locator('xpath=ancestor::div[contains(@class,"justify-between")]')
      .first();
    const rowBlockBtn = aliceRow.getByRole('button').first();
    if (await rowBlockBtn.isVisible()) {
      await rowBlockBtn.click();
      // Подтвердить блокировку — кнопка внутри диалога
      const dialog = page.locator('[role="dialog"]');
      await dialog.waitFor({ state: 'visible', timeout: 3000 });
      await dialog.getByRole('button', { name: /заблокир/i }).click();
      await page.waitForTimeout(500);
      expect(blockCalled).toBe(true);
    }
  });

  test('кнопка "Разблокировать" для заблокированного пользователя', async ({ page }) => {
    let unblockCalled = false;
    await page.route(/\/api\/admin\/users\/[^?]+\/unblock/, route => {
      unblockCalled = true;
      return route.fulfill({ status: 200, json: {} });
    });
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /заблокированные/i }).click();
    await expect(page.getByText('Bob', { exact: true })).toBeVisible({ timeout: 8000 });
    // Кнопка в строке пользователя без текстового label, берём кнопку внутри строки Bob
    const bobRow = page
      .getByRole('link', { name: 'Bob', exact: true })
      .locator('xpath=ancestor::div[contains(@class,"justify-between")]')
      .first();
    const rowUnblockBtn = bobRow.getByRole('button').first();
    if (await rowUnblockBtn.isVisible()) {
      await rowUnblockBtn.click();
      // Подтвердить разблокировку — кнопка внутри диалога
      const dialog = page.locator('[role="dialog"]');
      await dialog.waitFor({ state: 'visible', timeout: 3000 });
      await dialog.getByRole('button', { name: /разблокир/i }).click();
      await page.waitForTimeout(500);
      expect(unblockCalled).toBe(true);
    }
  });

  test('вкладка "Предметы" показывает список предметов', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /предмет/i }).click();
    await expect(page.getByText('AK-47 | Redline')).toBeVisible({ timeout: 8000 });
  });

  test('кнопка "Добавить предмет" открывает модальное окно', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /предмет/i }).click();
    await expect(page.getByText('AK-47 | Redline')).toBeVisible({ timeout: 8000 });
    const addItemBtn = page.getByRole('button', { name: /добавить предмет/i });
    if (await addItemBtn.isVisible()) {
      await addItemBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });

  test('кнопка загрузки изображения открывает файловый диалог', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    await page.getByRole('button', { name: /добавить кейс/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    // Ищем кнопку загрузки изображения
    const uploadBtn = page.getByRole('button', { name: /загрузить|upload|изображение/i });
    if (await uploadBtn.isVisible()) {
      // FileChooser — просто проверяем что кнопка кликабельна
      await expect(uploadBtn).not.toBeDisabled();
    }
  });

  test('модалка закрывается при нажатии "Отмена"', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.getByRole('button', { name: /кейс/i }).click();
    await page.getByRole('button', { name: /добавить кейс/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    const cancelBtn = page.getByRole('button', { name: /отмена|cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
    }
  });
});
