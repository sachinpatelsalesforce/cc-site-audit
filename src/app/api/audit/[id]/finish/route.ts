import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const audit = await prisma.audit.findUnique({ where: { id } })
  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.audit.update({
    where: { id },
    data: { status: 'complete' },
  })

  return NextResponse.json({ ok: true })
}
