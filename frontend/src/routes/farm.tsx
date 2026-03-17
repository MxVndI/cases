import { createFileRoute, redirect } from '@tanstack/react-router'
import { Farm } from '@/pages/Farm'
import { authApi } from '@/services/api'

export const Route = createFileRoute('/farm')({
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
    component: Farm,
})
