import { createFileRoute } from '@tanstack/react-router'
import { Balance } from '@/pages/Balance'

export const Route = createFileRoute('/balance')({
    component: Balance,
})
