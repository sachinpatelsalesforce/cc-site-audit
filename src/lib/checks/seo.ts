import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkSEO(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const r: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []

    // Title tag
    const title = document.title
    r.push({
      id: 'title-tag',
      label: 'Page title tag present and unique',
      status: title && title.length > 10 && title.length < 70 ? 'pass' : title ? 'partial' : 'fail',
      detail: title ? `"${title.slice(0, 60)}${title.length > 60 ? '…' : ''}"` : 'No title tag',
    })

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    r.push({
      id: 'meta-description',
      label: 'Meta description present',
      status: metaDesc && metaDesc.length > 50 ? 'pass' : metaDesc ? 'partial' : 'fail',
      detail: metaDesc ? `${metaDesc.length} chars` : 'Missing',
      sfccValue: !metaDesc ? 'Commerce Cloud auto-generates SEO meta tags from product data — ensuring every page, PLP, and PDP has optimized descriptions without manual effort.' : undefined,
    })

    // Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogImage = document.querySelector('meta[property="og:image"]')
    r.push({
      id: 'open-graph',
      label: 'Open Graph tags (social sharing)',
      status: ogTitle && ogImage ? 'pass' : ogTitle || ogImage ? 'partial' : 'fail',
      sfccValue: !(ogTitle && ogImage) ? 'Commerce Cloud auto-populates Open Graph tags from product data — ensuring rich previews when pages are shared on social media.' : undefined,
    })

    // Structured data
    const hasStructuredData =
      !!document.querySelector('script[type="application/ld+json"]') ||
      !!document.querySelector('[itemtype*="schema.org"]')
    r.push({
      id: 'structured-data',
      label: 'Structured data / Schema.org markup',
      status: hasStructuredData ? 'pass' : 'fail',
      sfccValue: hasStructuredData ? undefined : 'Commerce Cloud SFRA generates Product, BreadcrumbList, and Organization schema markup automatically — enabling Google Rich Results (ratings stars in SERPs).',
    })

    // Canonical
    const canonical = document.querySelector('link[rel="canonical"]')
    r.push({
      id: 'canonical',
      label: 'Canonical URLs present',
      status: canonical ? 'pass' : 'fail',
      sfccValue: canonical ? undefined : 'Commerce Cloud automatically generates canonical URLs to prevent duplicate content penalties — critical for filtered/sorted pages that can create 100s of URL variants.',
    })

    // H1 heading
    const h1Count = document.querySelectorAll('h1').length
    r.push({
      id: 'h1',
      label: 'Single H1 heading on page',
      status: h1Count === 1 ? 'pass' : h1Count > 1 ? 'partial' : 'fail',
      detail: `${h1Count} H1 tags found`,
    })

    return r
  })
}
