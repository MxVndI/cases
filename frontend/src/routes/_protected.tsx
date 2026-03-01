import { createFileRoute, redirect } from '@tanstack/react-router'
import { authApi } from '../services/api';


export const Route = createFileRoute('/_protected')({
    beforeLoad: async ({ location }) => {
        try {



            const authResponse = await authApi.getMe();
            if (!authResponse.authenticated) {
                throw redirect({
                    to: '/login',
                    search: {
                        redirect: location.href,
                    },
                });
            }

        } catch (error) {
            console.log(error)
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});
