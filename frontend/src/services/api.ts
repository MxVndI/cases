import axios from 'axios';
import { toast } from 'sonner';
import { type User } from '../types/user';

export interface AuthResponse {
  authenticated: boolean;
  user: User | null;
}

export interface LoginCredentials {
  provider: 'yandex' | 'discord' | 'google';
}

export const MOCK_MODE = false;

const resolveDefaultApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost/api';
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}/api`;
};

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || resolveDefaultApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global blocked state — set when server returns 403 "blocked"
let _onBlocked: (() => void) | null = null;
export function setOnBlockedCallback(cb: () => void) {
  _onBlocked = cb;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      console.log('Неавторизован');
    } else if (status === 403 && error.response?.data?.detail === 'blocked') {
      _onBlocked?.();
    } else if (status && status >= 400) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' && detail.length > 0 && detail.length < 200
        ? detail
        : 'Что-то пошло не так';
      toast.error(msg);
    } else if (!error.response) {
      toast.error('Нет соединения с сервером');
    }
    return Promise.reject(error);
  }
);

export interface UpdateProfileData {
  nickname?: string;
}

export interface PublicUserProfile {
  id: string;
  nickname: string;
  role: string;
  status: string;
}

export const authApi = {
  getMe: async (): Promise<AuthResponse> => {
    try {
      const { data } = await api.get<User>('/user/v1/users/me');
      return { authenticated: true, user: data };
    } catch {
      return { authenticated: false, user: null };
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const { data: response } = await api.patch<User>('/user/v1/users/me', data);
    return response;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  requestProfileCode: async (): Promise<{ ok: boolean }> => {
    const { data } = await api.post('/auth/profile/update/start');
    return data;
  },

  verifyProfileCode: async (code: string): Promise<{ ok: boolean; verified: boolean }> => {
    const { data } = await api.post('/auth/profile/update/finish', { code });
    return data;
  },

  getLoginUrl: (provider: string): string => {
    return `${api.defaults.baseURL}/auth/${provider}/login`;
  },

  sendCode: async (email: string): Promise<{ ok: boolean }> => {
    const { data } = await api.post('/auth/email/login/start', { email });
    return data;
  },

  verifyCode: async (code: string, nickname?: string): Promise<{ ok: boolean; user: User | null }> => {
    const { data } = await api.post('/auth/email/login/finish', { code, ...(nickname ? { nickname } : {}) });
    return data;
  },
};

export const userApi = {
  getPublicByNickname: async (nickname: string): Promise<PublicUserProfile> => {
    const { data } = await api.get<PublicUserProfile>(`/user/v1/users/public/${encodeURIComponent(nickname)}`);
    return data;
  },
};

// --- Cases API ---
export interface CaseItem {
  id: string;
  name: string;
  rarity: { name: string; color: string };
  weapon: { name: string; type: string };
  img_url?: string | null;
  price: number;
  created_at: string;
}

export interface CaseContentEntry {
  item: CaseItem;
  drop_chance: number;
}

export interface CaseData {
  id: string;
  name: string;
  system_name?: string | null;
  tag?: string | null;
  status?: string;
  img_url?: string | null;
  price: number;
  created_at: string;
  case_content: CaseContentEntry[];
}

export interface OpenCaseResponse {
  won_item: CaseItem;
  inventory: { items: InventoryItem[] } | null;
}

export const casesApi = {
  getAll: async (): Promise<CaseData[]> => {
    const { data } = await api.get<CaseData[]>('/cases/');
    return data;
  },

  getById: async (id: string): Promise<CaseData> => {
    const { data } = await api.get<CaseData>(`/cases/${id}`);
    return data;
  },

  getByName: async (name: string): Promise<CaseData> => {
    const { data } = await api.get<CaseData>(`/cases/by-name/${encodeURIComponent(name)}`);
    return data;
  },

  getBySystemName: async (systemName: string): Promise<CaseData> => {
    const { data } = await api.get<CaseData>(`/cases/by-system-name/${encodeURIComponent(systemName)}`);
    return data;
  },

  open: async (id: string): Promise<OpenCaseResponse> => {
    const { data } = await api.post<OpenCaseResponse>(`/cases/open/${id}`);
    return data;
  },

  openByName: async (name: string): Promise<OpenCaseResponse> => {
    const { data } = await api.post<OpenCaseResponse>(`/cases/open/by-name/${encodeURIComponent(name)}`);
    return data;
  },

  openBySystemName: async (systemName: string): Promise<OpenCaseResponse> => {
    const { data } = await api.post<OpenCaseResponse>(`/cases/open/by-system-name/${encodeURIComponent(systemName)}`);
    return data;
  },

  getRecentWins: async (limit: number = 20): Promise<RecentWinEntry[]> => {
    const { data } = await api.get<RecentWinEntry[]>('/cases/recent_wins', {
      params: { limit },
    });
    return data;
  },

  getRecentWinsStreamUrl: (): string => `${apiBaseUrl}/cases/wins/stream`,

  getMyWinsStats: async (): Promise<MyWinsStats> => {
    const { data } = await api.get<MyWinsStats>('/cases/wins/my/stats');
    return data;
  },

  getMyWins: async (limit: number = 50, offset: number = 0): Promise<WinHistoryEntry[]> => {
    const { data } = await api.get<WinHistoryEntry[]>('/cases/wins/my', {
      params: { limit, offset },
    });
    return data;
  },

  getUserWins: async (userId: string, limit: number = 50, offset: number = 0): Promise<WinHistoryEntry[]> => {
    const { data } = await api.get<WinHistoryEntry[]>(`/cases/wins/user/${userId}`, {
      params: { limit, offset },
    });
    return data;
  },

  getUserWinsStats: async (userId: string): Promise<MyWinsStats> => {
    const { data } = await api.get<MyWinsStats>(`/cases/wins/user/${userId}/stats`);
    return data;
  },

  getRarities: async (): Promise<RarityData[]> => {
    const { data } = await api.get<RarityData[]>('/cases/rarities/');
    return data;
  },
};

export interface WinHistoryEntry {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  item_rarity: string;
  item_price: number;
  item_img_url?: string | null;
  case_name: string;
  timestamp: string;
}

export interface MyWinsStats {
  total_opened: number;
  recent_wins: WinHistoryEntry[];
}

export interface RecentWinEntry {
  user_id: string;
  user_nickname?: string | null;
  item_name: string;
  item_rarity: string;
  item_price: number;
  item_img_url?: string | null;
  case_name: string;
  timestamp: string;
}

// --- Payment API ---
export interface BalanceResponse {
  wallet: {
    balances: Record<string, number>;
  };
}

export interface TransactionEntry {
  id: string;
  from: string;
  to: string;
  currency: string;
  amount: number;
  created_at: string;
  description?: string;
}

export const paymentApi = {
  getBalance: async (userId: string): Promise<number> => {
    const { data } = await api.get<BalanceResponse>(`/payment/balance/${userId}`);
    return data.wallet.balances['CHC'] || 0;
  },

  getTransactions: async (userId: string): Promise<TransactionEntry[]> => {
    const { data } = await api.get<any[]>(`/payment/transaction/${userId}`);
    return data.map(tx => ({
      id: tx.id,
      from: tx.from,
      to: tx.to,
      currency: tx.currency,
      amount: tx.amount,
      created_at: tx.timestamp?.$date?.$numberLong
        ? new Date(parseInt(tx.timestamp.$date.$numberLong)).toISOString()
        : '',
      description: tx.description ?? undefined,
    }));
  },

  tap: async (amount: number): Promise<void> => {
    await api.post('/payment/tap', { amount });
  },

  claimDailyBonus: async (): Promise<{ success: boolean; message: string; amount: number }> => {
    const { data } = await api.post<{ success: boolean; message: string; amount: number }>('/payment/bonus/daily', {});
    return data;
  },
};

// --- Farm API ---
export interface FarmSyncResponse {
  pending: number;
  auto_clicker_level: number;
  auto_clicker_speed_level: number;
  offline_earned: number;
}

export interface FarmClaimResponse {
  claimed: number;
  success: boolean;
}

export const farmApi = {
  sync: async (autoClickerLevel: number, autoClickerSpeedLevel: number): Promise<FarmSyncResponse> => {
    const { data } = await api.post<FarmSyncResponse>('/cases/farm/sync', {
      auto_clicker_level: autoClickerLevel,
      auto_clicker_speed_level: autoClickerSpeedLevel,
    });
    return data;
  },

  claim: async (): Promise<FarmClaimResponse> => {
    const { data } = await api.post<FarmClaimResponse>('/cases/farm/claim');
    return data;
  },
};

// --- Inventory API ---
export interface InventoryItem {
  id: string;
  item_id: string;
  obtained_at: string;
}

export interface InventoryResponse {
  items: InventoryItem[];
}

export const inventoryApi = {
  getMyInventory: async (): Promise<InventoryItem[]> => {
    const { data } = await api.get<InventoryResponse>('/cases/inventory/');
    return data.items ?? [];
  },

  getUserInventory: async (userId: string): Promise<InventoryItem[]> => {
    const { data } = await api.get<InventoryResponse>(`/cases/inventory/user/${userId}`);
    return data.items ?? [];
  },

  sellItem: async (entryId: string): Promise<{ sold_price: number; item_id: string }> => {
    const { data } = await api.post<{ sold_price: number; item_id: string }>(`/cases/inventory/sell/${entryId}`);
    return data;
  },

  sellAll: async (): Promise<{ sold_count: number; total_price: number }> => {
    const { data } = await api.post<{ sold_count: number; total_price: number }>('/cases/inventory/sell-all');
    return data;
  },
};

// --- Admin API ---
export interface AdminCaseContentItem {
  item: CaseItem;
  drop_chance: number;
}

export interface AdminCaseResponse {
  id: string;
  name: string;
  system_name?: string | null;
  tag?: string | null;
  status?: string;
  img_url?: string | null;
  price: number;
  created_at: string;
  case_content: AdminCaseContentItem[];
}

export interface CreateCasePayload {
  name: string;
  price: number;
  img_url?: string | null;
  system_name?: string | null;
  tag?: string | null;
  status?: string;
  case_content: { item_id: string; drop_chance: number }[];
}

export interface UpdateCasePayload {
  id: string;
  name?: string;
  price?: number;
  img_url?: string | null;
  system_name?: string | null;
  tag?: string | null;
  status?: string;
  case_content?: { item_id: string; drop_chance: number }[];
}

export interface RarityData {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WeaponTypeData {
  id: string;
  name: string;
  created_at: string;
}

export interface TagData {
  id: string;
  name: string;
  created_at: string;
}

export interface WeaponData {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export const adminApi = {
  // Cases
  getCases: async (): Promise<AdminCaseResponse[]> => {
    const { data } = await api.get<AdminCaseResponse[]>('/admin/cases/');
    return data;
  },
  createCase: async (payload: CreateCasePayload): Promise<string> => {
    const { data } = await api.post<string>('/admin/cases/', payload);
    return data;
  },
  updateCase: async (payload: UpdateCasePayload): Promise<string> => {
    const { data } = await api.patch<string>('/admin/cases/', payload);
    return data;
  },
  deleteCase: async (id: string): Promise<void> => {
    await api.delete(`/admin/cases/${id}`);
  },

  // Items
  getItems: async (): Promise<CaseItem[]> => {
    const { data } = await api.get<CaseItem[]>('/admin/items/');
    return data;
  },
  createItem: async (itemData: Record<string, unknown>): Promise<string> => {
    const { data } = await api.post<string>('/admin/items/', itemData);
    return data;
  },
  updateItem: async (itemData: Record<string, unknown>): Promise<string> => {
    const { data } = await api.patch<string>('/admin/items/', itemData);
    return data;
  },
  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/admin/items/${id}`);
  },

  // Users
  getUsers: async (params?: {
    search?: string;
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<User[]> => {
    const { data } = await api.get<{ users: User[] }>('/admin/users/', { params });
    return data.users;
  },
  blockUser: async (userId: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/block`);
  },
  unblockUser: async (userId: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/unblock`);
  },
  updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<void> => {
    await api.patch(`/admin/users/${userId}/role`, { role });
  },
  grantBalance: async (userId: string, amount: number): Promise<void> => {
    await api.post(`/admin/users/${userId}/grant-balance`, { amount });
  },

  // Calculate chances
  calculateChances: async (itemIds: string[]): Promise<{ item_id: string; drop_chance: number }[]> => {
    const { data } = await api.post('/admin/cases/calculate_chances', { item_ids: itemIds });
    return data;
  },

  // Calculate suggested price
  calculatePrice: async (items: { item_id: string; drop_chance: number }[], margin: number = 1.1): Promise<{ expected_value: number; margin: number; suggested_price: number }> => {
    const { data } = await api.post('/admin/cases/calculate_price', { items, margin });
    return data;
  },

  // Upload image
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>('/admin/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },

  // Rarities
  getRarities: async (): Promise<RarityData[]> => {
    const { data } = await api.get<RarityData[]>('/admin/rarities/');
    return data;
  },
  createRarity: async (payload: { name: string; color: string }): Promise<RarityData> => {
    const { data } = await api.post<RarityData>('/admin/rarities/', payload);
    return data;
  },
  updateRarity: async (id: string, payload: { name?: string; color?: string }): Promise<RarityData> => {
    const { data } = await api.patch<RarityData>(`/admin/rarities/${id}`, payload);
    return data;
  },
  deleteRarity: async (id: string): Promise<void> => {
    await api.delete(`/admin/rarities/${id}`);
  },

  // Case tags
  getCaseTags: async (): Promise<TagData[]> => {
    const { data } = await api.get<TagData[]>('/admin/tags/');
    return data;
  },
  createCaseTag: async (payload: { name: string }): Promise<TagData> => {
    const { data } = await api.post<TagData>('/admin/tags/', payload);
    return data;
  },
  updateCaseTag: async (id: string, payload: { name?: string }): Promise<TagData> => {
    const { data } = await api.patch<TagData>(`/admin/tags/${id}`, payload);
    return data;
  },
  deleteCaseTag: async (id: string): Promise<void> => {
    await api.delete(`/admin/tags/${id}`);
  },

  // Weapon types
  getWeaponTypes: async (): Promise<WeaponTypeData[]> => {
    const { data } = await api.get<WeaponTypeData[]>('/admin/weapon-types/');
    return data;
  },
  createWeaponType: async (payload: { name: string }): Promise<WeaponTypeData> => {
    const { data } = await api.post<WeaponTypeData>('/admin/weapon-types/', payload);
    return data;
  },
  updateWeaponType: async (id: string, payload: { name?: string }): Promise<WeaponTypeData> => {
    const { data } = await api.patch<WeaponTypeData>(`/admin/weapon-types/${id}`, payload);
    return data;
  },
  deleteWeaponType: async (id: string): Promise<void> => {
    await api.delete(`/admin/weapon-types/${id}`);
  },

  // Weapons
  getWeapons: async (): Promise<WeaponData[]> => {
    const { data } = await api.get<WeaponData[]>('/admin/weapons/');
    return data;
  },
  createWeapon: async (payload: { name: string; type: string }): Promise<WeaponData> => {
    const { data } = await api.post<WeaponData>('/admin/weapons/', payload);
    return data;
  },
  updateWeapon: async (id: string, payload: { name?: string; type?: string }): Promise<WeaponData> => {
    const { data } = await api.patch<WeaponData>(`/admin/weapons/${id}`, payload);
    return data;
  },
  deleteWeapon: async (id: string): Promise<void> => {
    await api.delete(`/admin/weapons/${id}`);
  },
};

export default api;
