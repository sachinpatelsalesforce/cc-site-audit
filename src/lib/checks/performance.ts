import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkPerformance(page: Page): Promise<CheckResult[]> {
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const paint = performance.getEntriesByType('paint')
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime ?? null
    const domLoad = nav?.domContentLoadedEventEnd ?? null
    const fullLoad = nav?.loadEventEnd ?? null

    // LCP via PerformanceObserver not available retroactively; use load time as proxy
    return {
      fcp,
      domLoad,
      fullLoad,
      url: window.location.href,
    }
  })

  const results: CheckResult[] = []

  // FCP < 2.5s
  const fcp = metrics.fcp
  results.push({
    id: 'fcp',
    label: 'First Contentful Paint < 2.5s',
    status: fcp === null ? 'partial' : fcp < 2500 ? 'pass' : fcp < 4000 ? 'partial' : 'fail',
    detail: fcp !== null ? `${(fcp / 1000).toFixed(2)}s` : 'Could not measure',
    sfccValue: fcp !== null && fcp >= 2500 ? 'Storefront Next (PWA) + Heroku Edge Caching delivers sub-1s FCP — a direct ranking signal for Google and a key conversion driver.' : undefined,
  })

  // Page load < 5s proxy for LCP
  const load = metrics.fullLoad
  results.push({
    id: 'page-load',
    label: 'Page load time < 5s',
    status: load === null ? 'partial' : load < 3000 ? 'pass' : load < 5000 ? 'partial' : 'fail',
    detail: load !== null ? `${(load / 1000).toFixed(2)}s` : 'Could not measure',
    sfccValue: load !== null && load >= 5000 ? 'A 1-second delay in load time reduces conversions by 7%. Commerce Cloud\'s CDN and page caching strategies improve core web vitals across the board.' : undefined,
  })

  // HTTPS
  const isHTTPS = metrics.url.startsWith('https://')
  results.push({
    id: 'https',
    label: 'HTTPS enforced',
    status: isHTTPS ? 'pass' : 'fail',
    sfccValue: isHTTPS ? undefined : 'HTTPS is a Google ranking factor and required for Google Pay / Apple Pay. Commerce Cloud enforces HTTPS across all storefronts.',
  })

  // Lazy loading
  const hasLazyImages = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img')
    const lazy = Array.from(imgs).filter(img => img.getAttribute('loading') === 'lazy' || img.getAttribute('data-src'))
    return { total: imgs.length, lazy: lazy.length }
  })
  const lazyRatio = hasLazyImages.total > 0 ? hasLazyImages.lazy / hasLazyImages.total : 0
  results.push({
    id: 'lazy-images',
    label: 'Images lazy loaded',
    status: lazyRatio > 0.5 ? 'pass' : lazyRatio > 0.2 ? 'partial' : 'fail',
    detail: `${hasLazyImages.lazy}/${hasLazyImages.total} images lazy loaded`,
    sfccValue: lazyRatio <= 0.2 ? 'Commerce Cloud\'s image service delivers responsive, WebP-converted, lazy-loaded images via CDN — reducing image payload by up to 60%.' : undefined,
  })

  // Images sized
  const hasOversizedImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    const oversized = imgs.filter(img => {
      const natural = img.naturalWidth
      const displayed = img.clientWidth
      return natural > 0 && displayed > 0 && natural > displayed * 2
    })
    return { oversized: oversized.length, total: imgs.length }
  })
  results.push({
    id: 'image-sizing',
    label: 'Images properly sized (no oversized downloads)',
    status: hasOversizedImages.oversized === 0 ? 'pass' : hasOversizedImages.oversized < 3 ? 'partial' : 'fail',
    detail: `${hasOversizedImages.oversized} oversized images found`,
    sfccValue: hasOversizedImages.oversized > 0 ? 'Commerce Cloud\'s dynamic image resizing serves right-sized images per device — eliminating wasted bytes and improving Core Web Vitals.' : undefined,
  })

  return results
}
