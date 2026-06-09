import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkPerformance(page: Page): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  // HTTPS
  const url: string = await page.evaluate(() => window.location.href)
  results.push({
    id: 'https',
    label: 'HTTPS enforced',
    status: url.startsWith('https://') ? 'pass' : 'fail',
    sfccValue: url.startsWith('https://') ? undefined : "HTTPS is a Google ranking factor and required for Apple Pay / Google Pay. Commerce Cloud enforces HTTPS across all storefronts.",
  })

  // Lazy-loaded images
  const imgData: { total: number; lazy: number } = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    const lazy = imgs.filter(img => img.getAttribute('loading') === 'lazy' || img.getAttribute('data-src'))
    return { total: imgs.length, lazy: lazy.length }
  })
  const lazyRatio = imgData.total > 0 ? imgData.lazy / imgData.total : 0
  results.push({
    id: 'lazy-images',
    label: 'Images use lazy loading',
    status: lazyRatio > 0.5 ? 'pass' : lazyRatio > 0.2 ? 'partial' : 'fail',
    detail: `${imgData.lazy}/${imgData.total} images lazy loaded`,
    sfccValue: lazyRatio <= 0.2 ? "Commerce Cloud's image service delivers responsive, WebP-converted, lazy-loaded images via CDN — reducing image payload by up to 60%." : undefined,
  })

  // Oversized images
  const oversized: { total: number; oversized: number } = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    const over = imgs.filter(img => {
      const natural = img.naturalWidth
      const displayed = img.clientWidth
      return natural > 0 && displayed > 0 && natural > displayed * 2
    })
    return { total: imgs.length, oversized: over.length }
  })
  results.push({
    id: 'image-sizing',
    label: 'Images served at appropriate resolution',
    status: oversized.oversized === 0 ? 'pass' : oversized.oversized < 3 ? 'partial' : 'fail',
    detail: oversized.oversized > 0 ? `${oversized.oversized} oversized images found` : undefined,
    sfccValue: oversized.oversized > 0 ? "Commerce Cloud's dynamic image resizing serves right-sized images per device — eliminating wasted bytes and improving Core Web Vitals." : undefined,
  })

  // Render-blocking resources (count <link rel=stylesheet> + sync <script> in <head>)
  const blocking: number = await page.evaluate(() => {
    const head = document.head
    const syncScripts = Array.from(head.querySelectorAll('script:not([async]):not([defer]):not([type="module"])')).length
    const blockingCSS = Array.from(head.querySelectorAll('link[rel="stylesheet"]')).length
    return syncScripts + Math.max(0, blockingCSS - 2)
  })
  results.push({
    id: 'render-blocking',
    label: 'Minimal render-blocking resources',
    status: blocking === 0 ? 'pass' : blocking <= 3 ? 'partial' : 'fail',
    detail: blocking > 0 ? `${blocking} potential render-blocking resources` : undefined,
    sfccValue: blocking > 3 ? "Commerce Cloud's Storefront Next uses code-splitting and deferred loading to eliminate render-blocking scripts — directly improving LCP and FCP." : undefined,
  })

  // Viewport meta (mobile readiness, also a perf signal)
  const hasViewport: boolean = await page.evaluate(() =>
    !!document.querySelector('meta[name="viewport"][content*="width=device-width"]')
  )
  results.push({
    id: 'viewport-meta',
    label: 'Viewport meta tag present',
    status: hasViewport ? 'pass' : 'fail',
    sfccValue: hasViewport ? undefined : "Missing viewport meta causes mobile browsers to render at desktop width then scale down — triggering layout shifts and hurting CLS/LCP.",
  })

  return results
}
