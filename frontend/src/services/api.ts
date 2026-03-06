import axios from 'axios';
import { type User } from '../types/user';
export interface AuthResponse {
  authenticated: boolean;
  user: User | null;
}

export interface LoginCredentials {
  provider: 'yandex' | 'discord' | 'google';
}

export const MOCK_MODE = true;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Неавторизован');
    }
    return Promise.reject(error);
  }
);

export interface UpdateProfileData {
  nickname?: string;
  trade_link?: string;
  email?: string;
  password?: string;
}

const getMockUser = (): User | null => {
  const stored = localStorage.getItem('mockUser');
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
};

export const authApi = {
  getMe: async (): Promise<AuthResponse> => {
    if (MOCK_MODE) {
      const user = getMockUser();
      return { authenticated: !!user, user };
    }
    const { data } = await api.get<AuthResponse>('/auth/me');
    return data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    if (MOCK_MODE) {
      const user = getMockUser();
      if (!user) throw new Error('Not authenticated');
      const updated = { ...user, ...data };
      localStorage.setItem('mockUser', JSON.stringify(updated));
      return updated;
    }
    const { data: response } = await api.patch<User>('/auth/profile', data);
    return response;
  },

  logout: async (): Promise<void> => {
    if (MOCK_MODE) {
      localStorage.removeItem('mockUser');
      return;
    }
    await api.post('/auth/logout');
  },

  getLoginUrl: (provider: string): string => {
    if (MOCK_MODE) {
      return '#';
    }
    return `${api.defaults.baseURL}/auth/${provider}/login`;
  },
};

export const mockAuth = {
  login: (email: string, _password: string): User => {
    const user: User = {
      id: "1",
      email,
      nickname: email.split('@')[0],
      status: "active",
      role: email.toLowerCase().includes('admin') ? "admin" : "user",
      balance: 2450,
      registeredAt: "2026-01-15",
    };
    localStorage.setItem('mockUser', JSON.stringify(user));
    return user;
  },
  register: (nickname: string, email: string): User => {
    const user: User = {
      id: "1",
      email,
      nickname,
      status: "active",
      role: "user",
      balance: 1000,
      registeredAt: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem('mockUser', JSON.stringify(user));
    return user;
  },
  updateBalance: (amount: number): number => {
    const user = getMockUser();
    if (user) {
      user.balance = (user.balance || 0) + amount;
      localStorage.setItem('mockUser', JSON.stringify(user));
      return user.balance;
    }
    return 0;
  },
  getBalance: (): number => {
    const user = getMockUser();
    return user?.balance || 0;
  },
};

export default api;
