import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function checkAuth(req: NextRequest) {
  const token = req.headers.get('x-admin-token') ?? req.nextUrl.searchParams.get('token')
  const expected = process.env.ADMIN_PASSWORD ?? 'admin'
  return token === expected
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await req.json().catch(() => ({})) as { id?: string }
  if (id) {
    await prisma.audit.delete({ where: { id } })
  } else {
    await prisma.audit.deleteMany({})
  }
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      shareToken: true,
      siteUrl: true,
      auditorName: true,
      auditorEmail: true,
      opportunity: true,
      region: true,
      status: true,
      createdAt: true,
      results: true,
    },
  })

  // Derive overall score from results JSON without sending the full payload
  const rows = audits.map(a => {
    const results = a.results as { overallScore?: number; grade?: string } | null
    return {
      id: a.id,
      shareToken: a.shareToken,
      siteUrl: a.siteUrl,
      auditorName: a.auditorName,
      auditorEmail: a.auditorEmail,
      opportunity: a.opportunity,
      region: a.region,
      status: a.status,
      createdAt: a.createdAt,
      overallScore: results?.overallScore ?? null,
      grade: results?.grade ?? null,
    }
  })

  // Usage stats
  const total = rows.length
  const complete = rows.filter(r => r.status === 'complete').length
  const manual = rows.filter(r => r.status === 'manual' || r.status === 'complete').length
  const byRegion = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.region] = (acc[r.region] ?? 0) + 1
    return acc
  }, {})
  const byAuditor = Object.values(
    rows.reduce<Record<string, { name: string; email: string; count: number }>>((acc, r) => {
      const key = r.auditorEmail
      if (!acc[key]) acc[key] = { name: r.auditorName, email: r.auditorEmail, count: 0 }
      acc[key].count++
      return acc
    }, {})
  ).sort((a, b) => b.count - a.count)

  const avgScore = rows.filter(r => r.overallScore !== null).reduce((s, r) => s + (r.overallScore ?? 0), 0) /
    (rows.filter(r => r.overallScore !== null).length || 1)

  // Audits per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const byDay = rows
    .filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
    .reduce<Record<string, number>>((acc, r) => {
      const day = new Date(r.createdAt).toISOString().slice(0, 10)
      acc[day] = (acc[day] ?? 0) + 1
      return acc
    }, {})

  return NextResponse.json({
    audits: rows,
    stats: {
      total,
      complete,
      manual,
      avgScore: Math.round(avgScore),
      byRegion,
      byAuditor,
      byDay,
    },
  })
}
