import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import puppeteer from 'puppeteer'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const audit = await prisma.audit.findUnique({ where: { id } })
  if (!audit || audit.status !== 'complete') {
    return NextResponse.json({ error: 'Audit not ready' }, { status: 404 })
  }

  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const dashboardUrl = `${protocol}://${host}/share/${audit.shareToken}?print=1`

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(dashboardUrl, { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise(r => setTimeout(r, 1000))

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  })
  await browser.close()

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="site-audit-${id}.pdf"`,
    },
  })
}
