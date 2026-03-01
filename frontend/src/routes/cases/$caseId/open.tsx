import { createFileRoute } from '@tanstack/react-router'
import { CaseOpen } from '@/pages/CaseOpen'

export const Route = createFileRoute('/cases/$caseId/open')({
    component: CaseOpen,
})
