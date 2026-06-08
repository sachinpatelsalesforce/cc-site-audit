import { prisma } from '@/lib/db'
import AuditDashboard from '@/components/AuditDashboard'
import type { AuditRecord } from '@/types/audit'
import { notFound } from 'next/navigation'

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const audit = await prisma.audit.findUnique({ where: { shareToken: token } })

  if (!audit || audit.status !== 'complete') notFound()

  const record: AuditRecord = {
    ...audit,
    results: audit.results as AuditRecord['results'],
    createdAt: audit.createdAt.toISOString(),
  }

  return <AuditDashboard audit={record} isShare={true} />
}
