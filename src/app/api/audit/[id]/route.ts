import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scoreCategory, overallScore, scoreToGrade, extractOpportunities } from '@/lib/scoring'
import type { AuditResult, CategoryResult } from '@/types/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const audit = await prisma.audit.findUnique({ where: { id } })
  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(audit)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { categories } = await req.json() as { categories: CategoryResult[] }

  // Recalculate scores from the updated checks
  const rescored: CategoryResult[] = categories.map(cat => {
    const score = scoreCategory(cat)
    return { ...cat, score }
  })
  const overall = overallScore(rescored)
  const grade = scoreToGrade(overall)
  const topOpportunities = extractOpportunities(rescored)

  const audit = await prisma.audit.findUnique({ where: { id } })
  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = audit.results as unknown as AuditResult
  const updated: AuditResult = {
    ...existing,
    categories: rescored,
    overallScore: overall,
    grade,
    topOpportunities,
  }

  await prisma.audit.update({
    where: { id },
    data: { results: updated as object },
  })

  return NextResponse.json({ overallScore: overall, grade, topOpportunities })
}
