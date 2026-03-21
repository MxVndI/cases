import { createFileRoute, redirect } from '@tanstack/react-router'
import { authApi } from '../services/api';


export const Route = createFileRoute('/_protected')({
    beforeLoad: async ({ location }) => {
        const authResponse = await authApi.getMe();
        if (!authResponse.authenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});
