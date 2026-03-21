import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { routeTree } from './routeTree.gen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { AuthProvider } from './AuthContext'
import { PreferencesProvider } from './PreferencesContext'

const routerBasepath =
    import.meta.env.BASE_URL === '/'
        ? '/'
        : import.meta.env.BASE_URL.replace(/\/$/, '')

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,                    // Количество повторов при ошибке
            staleTime: 5 * 60 * 1000,    // Данные считаются свежими 5 минут
            gcTime: 10 * 60 * 1000,       // Время хранения в кэше (было cacheTime)
            refetchOnWindowFocus: false,  // Не перезапрашивать при фокусе окна
            refetchOnReconnect: true,     // Перезапрашивать при восстановлении сети
        },
        mutations: {
            retry: 1,                     // Повторы для мутаций
        },
    },
})
const router = createRouter({
    routeTree,
    basepath: routerBasepath,
})


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PreferencesProvider>
                    <RouterProvider router={router} />
                </PreferencesProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
)
