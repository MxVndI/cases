import type { Page } from '@playwright/test';

export const MOCK_USER = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  email: 'test@casehub.local',
  nickname: 'TestUser',
  status: 'active',
  role: 'user',
};

export const MOCK_ADMIN = {
  id: 'bbbbbbbb-0000-0000-0000-000000000001',
  email: 'admin@casehub.local',
  nickname: 'Admin',
  status: 'active',
  role: 'admin',
};

export const MOCK_CASES = [
  {
    id: 'case-001',
    name: 'Стартовый кейс',
    img_url: null,
    price: 100,
    created_at: '2025-01-01T00:00:00Z',
    case_content: [
      {
        item: {
          id: 'item-001',
          name: 'AK-47 | Redline',
          rarity: { name: 'rare', color: '#4B9CDB' },
          weapon: { name: 'AK-47', type: 'rifle' },
          img_url: null,
          price: 250,
          created_at: '2025-01-01T00:00:00Z',
        },
        drop_chance: 0.3,
      },
      {
        item: {
          id: 'item-002',
          name: 'AWP | Dragon Lore',
          rarity: { name: 'legendary', color: '#E4AE39' },
          weapon: { name: 'AWP', type: 'sniper' },
          img_url: null,
          price: 5000,
          created_at: '2025-01-01T00:00:00Z',
        },
        drop_chance: 0.05,
      },
      {
        item: {
          id: 'item-003',
          name: 'Glock-18 | Fade',
          rarity: { name: 'common', color: '#B0C3D9' },
          weapon: { name: 'Glock-18', type: 'pistol' },
          img_url: null,
          price: 50,
          created_at: '2025-01-01T00:00:00Z',
        },
        drop_chance: 0.65,
      },
    ],
  },
  {
    id: 'case-002',
    name: 'Легендарный кейс',
    img_url: null,
    price: 500,
    created_at: '2025-01-01T00:00:00Z',
    case_content: [
      {
        item: {
          id: 'item-004',
          name: 'M4A4 | Howl',
          rarity: { name: 'exotic', color: '#EB4B4B' },
          weapon: { name: 'M4A4', type: 'rifle' },
          img_url: null,
          price: 10000,
          created_at: '2025-01-01T00:00:00Z',
        },
        drop_chance: 1.0,
      },
    ],
  },
];

export const MOCK_RECENT_WINS = [
  {
    user_id: 'aaaaaaaa-0000-0000-0000-000000000002',
    item_name: 'AWP | Dragon Lore',
    item_rarity: 'legendary',
    item_price: 5000,
    case_name: 'Стартовый кейс',
    timestamp: '2025-01-01T12:00:00Z',
  },
  {
    user_id: 'aaaaaaaa-0000-0000-0000-000000000003',
    item_name: 'AK-47 | Redline',
    item_rarity: 'rare',
    item_price: 250,
    case_name: 'Стартовый кейс',
    timestamp: '2025-01-01T11:00:00Z',
  },
];

export const MOCK_BALANCE = 1500;

export const MOCK_TRANSACTIONS = [
  {
    id: 'tx-001',
    from: '00000000-0000-0000-0000-000000000000',
    to: MOCK_USER.id,
    currency: 'CHC',
    amount: 100,
    timestamp: { $date: { $numberLong: '1735689600000' } },
  },
  {
    id: 'tx-002',
    from: MOCK_USER.id,
    to: '00000000-0000-0000-0000-000000000000',
    currency: 'CHC',
    amount: 100,
    timestamp: { $date: { $numberLong: '1735693200000' } },
  },
];

export const MOCK_INVENTORY = [
  { item_id: 'item-001', obtained_at: '2025-01-01T10:00:00Z' },
  { item_id: 'item-002', obtained_at: '2025-01-01T11:00:00Z' },
];

export const MOCK_USERS_LIST = [
  { id: 'user-aaa', email: 'alice@test.com', nickname: 'Alice', status: 'active', role: 'user' },
  { id: 'user-bbb', email: 'bob@test.com', nickname: 'Bob', status: 'blocked', role: 'user' },
];

export const MOCK_ITEMS = [
  {
    id: 'item-001',
    name: 'AK-47 | Redline',
    rarity: { name: 'rare', color: '#4B9CDB' },
    weapon: { name: 'AK-47', type: 'rifle' },
    img_url: null,
    price: 250,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'item-002',
    name: 'AWP | Dragon Lore',
    rarity: { name: 'legendary', color: '#E4AE39' },
    weapon: { name: 'AWP', type: 'sniper' },
    img_url: null,
    price: 5000,
    created_at: '2025-01-01T00:00:00Z',
  },
];

export const MOCK_RARITIES = [
  { name: 'common', color: '#B0C3D9' },
  { name: 'rare', color: '#4B9CDB' },
  { name: 'epic', color: '#8847FF' },
  { name: 'legendary', color: '#E4AE39' },
  { name: 'exotic', color: '#EB4B4B' },
];

/** Mock unauthenticated state (user not logged in) */
export async function mockUnauthenticated(page: Page) {
  await page.route('**/api/user/v1/users/me', route =>
    route.fulfill({ status: 401, json: { detail: 'Unauthorized' } })
  );
}

/** Mock authenticated state as regular user */
export async function mockAuthenticatedUser(page: Page, user = MOCK_USER) {
  await page.route('**/api/user/v1/users/me', route =>
    route.fulfill({ status: 200, json: user })
  );
  await page.route(`**/api/payment/balance/${user.id}`, route =>
    route.fulfill({ status: 200, json: { wallet: { balances: { CHC: MOCK_BALANCE } } } })
  );
}

/** Mock authenticated state as admin */
export async function mockAuthenticatedAdmin(page: Page) {
  await mockAuthenticatedUser(page, MOCK_ADMIN);
  await page.route(`**/api/payment/balance/${MOCK_ADMIN.id}`, route =>
    route.fulfill({ status: 200, json: { wallet: { balances: { CHC: 9999 } } } })
  );
}

/** Mock cases API */
export async function mockCasesApi(page: Page) {
  await page.route('**/api/cases/', route =>
    route.fulfill({ status: 200, json: MOCK_CASES })
  );
  for (const c of MOCK_CASES) {
    await page.route(`**/api/cases/${c.id}`, route =>
      route.fulfill({ status: 200, json: c })
    );
  }
  await page.route('**/api/cases/recent_wins**', route =>
    route.fulfill({ status: 200, json: MOCK_RECENT_WINS })
  );
}

/** Mock payment API */
export async function mockPaymentApi(page: Page, userId = MOCK_USER.id) {
  await page.route(`**/api/payment/balance/${userId}`, route =>
    route.fulfill({ status: 200, json: { wallet: { balances: { CHC: MOCK_BALANCE } } } })
  );
  await page.route(`**/api/payment/transaction/${userId}`, route =>
    route.fulfill({ status: 200, json: MOCK_TRANSACTIONS })
  );
  await page.route('**/api/payment/tap', route =>
    route.fulfill({ status: 200, json: {} })
  );
  await page.route('**/api/payment/bonus/daily', route =>
    route.fulfill({ status: 200, json: { success: true, message: 'Бонус получен! +100 CHC', amount: 100 } })
  );
}

/** Mock inventory API */
export async function mockInventoryApi(page: Page) {
  await page.route('**/api/cases/inventory/**', route =>
    route.fulfill({ status: 200, json: { items: MOCK_INVENTORY } })
  );
  await page.route('**/api/cases/inventory/sell/**', route =>
    route.fulfill({ status: 200, json: { ok: true } })
  );
}

/** Mock admin API */
export async function mockAdminApi(page: Page) {
  await page.route('**/api/admin/users/**', route =>
    route.fulfill({ status: 200, json: { users: MOCK_USERS_LIST, total: MOCK_USERS_LIST.length } })
  );
  await page.route('**/api/admin/cases/**', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, json: MOCK_CASES });
    }
    return route.fulfill({ status: 200, json: MOCK_CASES[0] });
  });
  await page.route('**/api/admin/items/**', route =>
    route.fulfill({ status: 200, json: MOCK_ITEMS })
  );
  await page.route('**/api/admin/rarities/**', route =>
    route.fulfill({ status: 200, json: MOCK_RARITIES })
  );
  await page.route('**/api/admin/upload/image', route =>
    route.fulfill({ status: 200, json: { url: 'http://localhost/api/images/test.png' } })
  );
  await page.route('**/api/admin/cases/calculate_chances', route =>
    route.fulfill({ status: 200, json: { chances: { 'item-001': 0.5, 'item-002': 0.5 } } })
  );
}
