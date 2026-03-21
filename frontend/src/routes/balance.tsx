import { createFileRoute, redirect } from '@tanstack/react-router'
import { Balance } from '@/pages/Balance'
import { authApi } from '@/services/api'

export const Route = createFileRoute('/balance')({
    beforeLoad: async ({ location }) => {
        const authResponse = await authApi.getMe()
        if (!authResponse.authenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }
    },
    component: Balance,
})
