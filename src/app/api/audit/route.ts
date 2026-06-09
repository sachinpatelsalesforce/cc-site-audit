import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { runAudit } from '@/lib/auditor'
import { buildManualTemplate } from '@/lib/manual-template'
import { checkVitals } from '@/lib/checks/vitals'
import { checkAIReadiness } from '@/lib/checks/ai-readiness'
import { checkTechStack } from '@/lib/checks/tech-stack'
import { overallScore, scoreToGrade, extractOpportunities, scoreCategory } from '@/lib/scoring'
import type { AuditResult, CategoryResult } from '@/types/audit'

async function checkSEOFetch(siteUrl: string): Promise<CategoryResult['checks']> {
  const normalized = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  try {
    const res = await fetch(normalized, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteAuditBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    const html = await res.text()

    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? ''
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]
      ?? ''
    const hasOgTitle = /<meta[^>]+property=["']og:title["']/i.test(html)
    const hasOgImage = /<meta[^>]+property=["']og:image["']/i.test(html)
    const hasStructuredData = /application\/ld\+json/i.test(html) || /itemtype=["'][^"']*schema\.org/i.test(html)
    const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html)
    const h1Matches = (html.match(/<h1[\s>]/gi) ?? []).length

    return [
      {
        id: 'title-tag',
        label: 'Page title tag present and unique',
        status: title && title.length > 10 && title.length < 70 ? 'pass' : title ? 'partial' : 'fail',
        detail: title ? `"${title.slice(0, 60)}${title.length > 60 ? '…' : ''}"` : 'No title tag',
      },
      {
        id: 'meta-description',
        label: 'Meta description present',
        status: metaDesc && metaDesc.length > 50 ? 'pass' : metaDesc ? 'partial' : 'fail',
        detail: metaDesc ? `${metaDesc.length} chars` : 'Missing',
        sfccValue: !metaDesc ? 'Commerce Cloud auto-generates SEO meta tags from product data — ensuring every page, PLP, and PDP has optimized descriptions without manual effort.' : undefined,
      },
      {
        id: 'open-graph',
        label: 'Open Graph tags (social sharing)',
        status: hasOgTitle && hasOgImage ? 'pass' : hasOgTitle || hasOgImage ? 'partial' : 'fail',
        sfccValue: !(hasOgTitle && hasOgImage) ? 'Commerce Cloud auto-populates Open Graph tags from product data — ensuring rich previews when pages are shared on social media.' : undefined,
      },
      {
        id: 'structured-data',
        label: 'Structured data / Schema.org markup',
        status: hasStructuredData ? 'pass' : 'fail',
        sfccValue: !hasStructuredData ? 'Commerce Cloud SFRA generates Product, BreadcrumbList, and Organization schema markup automatically — enabling Google Rich Results.' : undefined,
      },
      {
        id: 'canonical',
        label: 'Canonical URLs present',
        status: hasCanonical ? 'pass' : 'fail',
        sfccValue: !hasCanonical ? 'Commerce Cloud automatically generates canonical URLs to prevent duplicate content penalties — critical for filtered/sorted pages.' : undefined,
      },
      {
        id: 'h1',
        label: 'Single H1 heading on page',
        status: h1Matches === 1 ? 'pass' : h1Matches > 1 ? 'partial' : 'fail',
        detail: `${h1Matches} H1 tags found`,
      },
    ]
  } catch {
    return []
  }
}

async function runManualAudit(auditId: string, siteUrl: string) {
  try {
    // Run all automated checks in parallel while the user fills the form
    const [vitalsResult, aiReadinessResult, techStackResult, seoChecks] = await Promise.all([
      checkVitals(siteUrl),
      checkAIReadiness(siteUrl),
      checkTechStack(siteUrl),
      checkSEOFetch(siteUrl),
    ])

    // Re-read current results (user may have started editing)
    const current = await prisma.audit.findUnique({ where: { id: auditId } })
    const existingCategories = (current?.results as AuditResult | null)?.categories ?? buildManualTemplate()

    const withRealData: CategoryResult[] = existingCategories.map(cat => {
      if (cat.id === 'vitals') {
        const checks = vitalsResult.checks
        return { ...cat, checks, score: scoreCategory({ ...cat, checks }) }
      }
      if (cat.id === 'ai-readiness') {
        const checks = aiReadinessResult.checks
        return { ...cat, checks, score: scoreCategory({ ...cat, checks }) }
      }
      if (cat.id === 'seo' && seoChecks.length > 0) {
        return { ...cat, checks: seoChecks, score: scoreCategory({ ...cat, checks: seoChecks }) }
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
