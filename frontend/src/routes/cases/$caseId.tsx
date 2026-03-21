import { createFileRoute } from '@tanstack/react-router'
import { CaseDetail } from '@/pages/CaseDetail'

export const Route = createFileRoute('/cases/$caseId')({
    component: CaseDetail,
})
