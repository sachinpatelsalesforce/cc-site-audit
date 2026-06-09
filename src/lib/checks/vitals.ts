import type { CheckResult, CheckStatus } from '@/types/audit'

interface PSICategory {
  score: number | null
}

interface PSIAudit {
  score: number | null
  numericValue?: number
  displayValue?: string
  description?: string
}

interface PSIResponse {
  lighthouseResult?: {
    categories: {
      performance?: PSICategory
    }
    audits: Record<string, PSIAudit>
  }
  error?: { message: string }
}

export interface VitalsResult {
  checks: CheckResult[]
  lighthouseScore: number | null
  rawMetrics: Record<string, { value: number | null; display: string }>
}

function psiStatus(value: number | null, good: number, poor: number, lowerIsBetter = true): CheckStatus {
  if (value === null) return 'partial'
  if (lowerIsBetter) {
    if (value <= good) return 'pass'
    if (value <= poor) return 'partial'
    return 'fail'
  } else {
    if (value >= good) return 'pass'
    if (value >= poor) return 'partial'
    return 'fail'
  }
}

export async function checkVitals(siteUrl: string): Promise<VitalsResult> {
  const apiKey = process.env.PSI_API_KEY || ''
  const normalised = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`

  const params = new URLSearchParams({
    url: normalised,
    strategy: 'mobile',
    category: 'performance',
  })
  if (apiKey) params.set('key', apiKey)

  let data: PSIResponse
  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: AbortSignal.timeout(60000) }
    )
    data = await res.json() as PSIResponse
  } catch {
    return fallbackVitals('PageSpeed Insights request timed out or failed.')
  }

  if (data.error || !data.lighthouseResult) {
    return fallbackVitals(data.error?.message || 'No Lighthouse result returned.')
  }

  const audits = data.lighthouseResult.audits
  const lhScore = data.lighthouseResult.categories.performance?.score ?? null

  function get(key: string) {
    const a = audits[key]
    return {
      value: a?.numericValue ?? null,
      display: a?.displayValue ?? 'N/A',
    }
  }

  const lcp = get('largest-contentful-paint')
  const inp = get('interaction-to-next-paint')
  const cls = get('cumulative-layout-shift')
  const fcp = get('first-contentful-paint')
  const ttfb = get('server-response-time')
  const tbt = get('total-blocking-time')
  const si = get('speed-index')

  const checks: CheckResult[] = [
    {
      id: 'lcp',
      label: 'Largest Contentful Paint (LCP)',
      status: psiStatus(lcp.value, 2500, 4000),
      detail: lcp.display,
      sfccValue: lcp.value !== null && lcp.value > 2500
        ? "Storefront Next (PWA) on a CDN-cached edge delivers LCP under 1.5s — a direct Google ranking signal. Commerce Cloud's image service and edge caching eliminate the server-render bottleneck."
        : undefined,
    },
    {
      id: 'inp',
      label: 'Interaction to Next Paint (INP)',
      status: psiStatus(inp.value, 200, 500),
      detail: inp.display,
      sfccValue: inp.value !== null && inp.value > 200
        ? "High INP means the page feels sluggish to interact with. Storefront Next's lightweight React architecture and deferred JS loading keeps INP well under 200ms."
        : undefined,
    },
    {
      id: 'cls',
      label: 'Cumulative Layout Shift (CLS)',
      status: psiStatus(cls.value, 0.1, 0.25),
      detail: cls.display,
      sfccValue: cls.value !== null && cls.value > 0.1
        ? "Layout shifts frustrate shoppers and hurt conversions. Commerce Cloud's SFRA and Storefront Next reserve explicit dimensions for images and ads — keeping CLS near zero."
        : undefined,
    },
    {
      id: 'fcp',
      label: 'First Contentful Paint (FCP)',
      status: psiStatus(fcp.value, 1800, 3000),
      detail: fcp.display,
      sfccValue: fcp.value !== null && fcp.value > 1800
        ? "Slow FCP signals a slow server or render-blocking resources. Commerce Cloud uses server-side rendering and critical-CSS inlining to paint content instantly."
        : undefined,
    },
    {
      id: 'ttfb',
      label: 'Time to First Byte (TTFB)',
      status: psiStatus(ttfb.value, 800, 1800),
      detail: ttfb.display,
      sfccValue: ttfb.value !== null && ttfb.value > 800
        ? "TTFB over 800ms usually means slow server or no caching. Commerce Cloud's global CDN and page-level caching reduce TTFB to under 200ms for cached pages."
        : undefined,
    },
    {
      id: 'tbt',
      label: 'Total Blocking Time (TBT)',
      status: psiStatus(tbt.value, 200, 600),
      detail: tbt.display,
      sfccValue: tbt.value !== null && tbt.value > 200
        ? "High TBT means heavy JavaScript is blocking the main thread. Commerce Cloud's code-splitting and deferred third-party scripts keep TBT minimal."
        : undefined,
    },
    {
      id: 'lh-score',
      label: 'Lighthouse Performance Score',
      status: psiStatus(lhScore !== null ? lhScore * 100 : null, 90, 50),
      detail: lhScore !== null ? `${Math.round(lhScore * 100)}/100` : 'N/A',
      sfccValue: lhScore !== null && lhScore < 0.9
        ? "A Lighthouse score below 90 signals multiple performance gaps. Commerce Cloud's Storefront Next consistently achieves 90+ out-of-the-box with optimised build pipelines."
        : undefined,
    },
    {
      id: 'speed-index',
      label: 'Speed Index',
      status: psiStatus(si.value, 3400, 5800),
      detail: si.display,
    },
  ]

  return {
    checks,
    lighthouseScore: lhScore !== null ? Math.round(lhScore * 100) : null,
    rawMetrics: { lcp, inp, cls, fcp, ttfb, tbt },
  }
}

function fallbackVitals(reason: string): VitalsResult {
  const checks: CheckResult[] = [
    { id: 'lcp', label: 'Largest Contentful Paint (LCP)', status: 'partial', detail: reason },
    { id: 'inp', label: 'Interaction to Next Paint (INP)', status: 'partial', detail: reason },
    { id: 'cls', label: 'Cumulative Layout Shift (CLS)', status: 'partial', detail: reason },
    { id: 'fcp', label: 'First Contentful Paint (FCP)', status: 'partial', detail: reason },
    { id: 'ttfb', label: 'Time to First Byte (TTFB)', status: 'partial', detail: reason },
    { id: 'tbt', label: 'Total Blocking Time (TBT)', status: 'partial', detail: reason },
    { id: 'lh-score', label: 'Lighthouse Performance Score', status: 'partial', detail: reason },
    { id: 'speed-index', label: 'Speed Index', status: 'partial', detail: reason },
  ]
  return { checks, lighthouseScore: null, rawMetrics: {} }
}
