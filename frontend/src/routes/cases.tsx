import { createFileRoute } from '@tanstack/react-router'
import { Cases } from '@/pages/Cases'

export const Route = createFileRoute('/cases')({
    component: Cases,
})
