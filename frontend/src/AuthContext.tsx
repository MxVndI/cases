import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, MOCK_MODE, mockAuth, type UpdateProfileData } from './services/api';
import { type User } from './types/user'
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    login: (provider: string) => void;
    logout: () => Promise<void>;
    refetchUser: () => Promise<void>;
    updateProfile: (data: UpdateProfileData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ключи для кэширования
export const authKeys = {
    all: ['auth'] as const,
    user: () => [...authKeys.all, 'user'] as const,
    session: () => [...authKeys.all, 'session'] as const,
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const queryClient = useQueryClient();

    // Запрос данных пользователя с TanStack Query
    const {
        data: authResponse,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: authKeys.user(),
        queryFn: authApi.getMe,
        staleTime: 5 * 60 * 1000, // 5 минут
        retry: 1,
        // Важно: начальные данные показывают, что пользователь не авторизован
        placeholderData: { authenticated: false, user: null },
    });

    // Мутация для логаута
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            // Инвалидируем кэш пользователя
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            // Очищаем кэш
            queryClient.clear();
        },
    });

    // Мутация для обновления профиля
    const updateProfileMutation = useMutation({
        mutationFn: authApi.updateProfile,
        onSuccess: () => {
            // Инвалидируем кэш пользователя для получения обновленных данных
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
        },
    });

    const user = authResponse?.authenticated ? authResponse.user : null;

    const login = (provider: string) => {
        if (MOCK_MODE) {
            const mockEmail = `${provider}.demo@casehub.local`;
            mockAuth.login(mockEmail, 'demo');
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            return;
        }
        // Сохраняем текущий URL для редиректа
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        // Редирект на OAuth провайдера
        window.location.href = authApi.getLoginUrl(provider);
    };

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
    };

    const refetchUser = async () => {
        await refetch();
    };

    const handleUpdateProfile = async (data: UpdateProfileData) => {
        await updateProfileMutation.mutateAsync(data);
    };



    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isError,
                error: error as Error | null,
                login,
                logout: handleLogout,
                refetchUser,
                updateProfile: handleUpdateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
