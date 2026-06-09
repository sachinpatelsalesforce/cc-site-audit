import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { runAudit } from '@/lib/auditor'
import { buildManualTemplate } from '@/lib/manual-template'
import { checkVitals } from '@/lib/checks/vitals'
import { checkAIReadiness } from '@/lib/checks/ai-readiness'
import { checkTechStack } from '@/lib/checks/tech-stack'
import { overallScore, scoreToGrade, extractOpportunities, scoreCategory } from '@/lib/scoring'
import type { AuditResult, CategoryResult } from '@/types/audit'

async function runManualAudit(auditId: string, siteUrl: string) {
  try {
    // Run the three automated checks in parallel while the user fills the form
    const [vitalsResult, aiReadinessResult, techStackResult] = await Promise.all([
      checkVitals(siteUrl),
      checkAIReadiness(siteUrl),
      checkTechStack(siteUrl),
    ])

    // Build manual template and replace vitals + AI readiness with real data
    const template = buildManualTemplate()

    const withRealData: CategoryResult[] = template.map(cat => {
      if (cat.id === 'vitals') {
        const checks = vitalsResult.checks
        return { ...cat, checks, score: scoreCategory({ ...cat, checks }) }
      }
      if (cat.id === 'ai-readiness') {
        const checks = aiReadinessResult.checks
        return { ...cat, checks, score: scoreCategory({ ...cat, checks }) }
      }
      return cat
    })

    const overall = overallScore(withRealData)
    const grade = scoreToGrade(overall)
    const topOpportunities = extractOpportunities(withRealData)

    const results: AuditResult = {
      overallScore: overall,
      grade,
      siteUrl,
      crawledPages: {},
      lighthouseScore: vitalsResult.lighthouseScore,
      categories: withRealData,
      topOpportunities,
      techStack: techStackResult,
      completedAt: new Date().toISOString(),
    }

    await prisma.audit.update({
      where: { id: auditId },
      data: { results: results as object },
    })
  } catch {
    // Non-fatal — manual audit still works, just without pre-filled data
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { siteUrl, auditorName, auditorEmail, opportunity, region, mode } = body

  if (!siteUrl || !auditorName || !auditorEmail || !region) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (mode === 'manual') {
    // Create record immediately with blank template so user can start right away
    const template = buildManualTemplate()
    const results: AuditResult = {
      overallScore: 0,
      grade: 'F',
      siteUrl,
      crawledPages: {},
      categories: template,
      topOpportunities: [],
      completedAt: new Date().toISOString(),
    }
    const audit = await prisma.audit.create({
      data: {
        siteUrl, auditorName, auditorEmail, opportunity, region,
        status: 'manual',
        progress: 100,
        currentStep: 'Manual audit',
        results: results as object,
      },
    })

    // Fire and forget — populate vitals/AI/tech in background
    runManualAudit(audit.id, siteUrl).catch(console.error)

    return NextResponse.json({ id: audit.id, shareToken: audit.shareToken, mode: 'manual' })
  }

  const audit = await prisma.audit.create({
    data: { siteUrl, auditorName, auditorEmail, opportunity, region },
  })

  // Fire and forget — don't await
  runAudit(audit.id, siteUrl).catch(console.error)

  return NextResponse.json({ id: audit.id, shareToken: audit.shareToken })
}
