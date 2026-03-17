import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, setOnBlockedCallback, type AuthResponse, type UpdateProfileData } from './services/api';
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
    isBlocked: boolean;
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
    const [isBlocked, setIsBlocked] = useState(false);

    // Register global blocked callback
    useEffect(() => {
        setOnBlockedCallback(() => setIsBlocked(true));
    }, []);

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
        onSuccess: (updatedUser) => {
            // Обновляем кэш пользователя с данными из ответа
            queryClient.setQueryData(authKeys.user(), (old: AuthResponse | undefined) => {
                if (!old) return old;
                return { ...old, user: { ...old.user, ...updatedUser } };
            });
        },
    });

    const user = authResponse?.authenticated ? authResponse.user : null;

    // Check if user is blocked on load
    useEffect(() => {
        if (user?.status === 'blocked') {
            setIsBlocked(true);
        }
    }, [user?.status]);

    const login = (provider: string) => {
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
                isBlocked,
            }}
        >
            {children}
            {isBlocked && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-card p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/15 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Аккаунт заблокирован</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Ваш аккаунт был заблокирован. Все действия на сайте недоступны.
                        </p>
                        <button
                            onClick={async () => {
                                try { await logoutMutation.mutateAsync(); } catch {}
                                window.location.href = '/';
                            }}
                            className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            )}
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
