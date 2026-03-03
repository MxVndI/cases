import { createFileRoute } from '@tanstack/react-router'
import { Farm } from '@/pages/Farm'

export const Route = createFileRoute('/farm')({
    component: Farm,
})
