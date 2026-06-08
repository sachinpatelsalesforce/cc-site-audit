import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { runAudit } from '@/lib/auditor'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { siteUrl, auditorName, auditorEmail, opportunity, region } = body

  if (!siteUrl || !auditorName || !auditorEmail || !region) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const audit = await prisma.audit.create({
    data: { siteUrl, auditorName, auditorEmail, opportunity, region },
  })

  // Fire and forget — don't await
  runAudit(audit.id, siteUrl).catch(console.error)

  return NextResponse.json({ id: audit.id, shareToken: audit.shareToken })
}
