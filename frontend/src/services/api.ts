import axios from 'axios';
import { type User } from '../types/user';
export interface AuthResponse {
  authenticated: boolean;
  user: User|null;
}

export interface LoginCredentials {
  provider: 'yandex' | 'discord' | 'google';
}

const api = axios.create({
  baseURL: 'http://localhost/api',
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
}

export const authApi = {

  getMe: async (): Promise<AuthResponse> => {
    const { data } = await api.get<AuthResponse>('/auth/me');
    return data;
  },

  // Обновление профиля
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const { data: response } = await api.patch<User>('/auth/profile', data);
    return response;
  },

  // Логаут
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // Получение URL для редиректа (опционально)
  getLoginUrl: (provider: string): string => {
    return `${api.defaults.baseURL}/auth/${provider}/login`;
  },
};

export default api;
