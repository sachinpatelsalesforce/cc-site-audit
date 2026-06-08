import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkMobile(page: Page): Promise<CheckResult[]> {
  // Run checks in mobile viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.reload({ waitUntil: 'domcontentloaded' })

  const results = await page.evaluate(() => {
    const r: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []
    const bodyText = document.body.innerText.toLowerCase()

    // Responsive layout (viewport meta tag)
    const hasViewportMeta = !!document.querySelector('meta[name="viewport"]')
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || ''
    const isResponsive = hasViewportMeta && viewport.includes('width=device-width')
    r.push({
      id: 'responsive',
      label: 'Responsive / mobile-optimized layout',
      status: isResponsive ? 'pass' : 'fail',
      sfccValue: isResponsive ? undefined : '60%+ of ecommerce traffic is mobile. Commerce Cloud\'s Storefront Reference Architecture (SFRA) is mobile-first by default.',
    })

    // Mobile nav
    const hasMobileNav =
      !!document.querySelector('[class*="hamburger"], [class*="mobile-nav"], [class*="nav-toggle"], button[aria-label*="menu" i], [class*="bottom-nav"]')
    r.push({
      id: 'mobile-nav',
      label: 'Mobile-friendly navigation',
      status: hasMobileNav ? 'pass' : 'fail',
      sfccValue: hasMobileNav ? undefined : 'SFRA includes a responsive hamburger navigation out-of-the-box, optimized for thumb-reach zones on mobile.',
    })

    // Touch targets (buttons large enough)
    const buttons = document.querySelectorAll('button, a, input[type="submit"]')
    let smallCount = 0
    buttons.forEach(b => {
      const rect = b.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        smallCount++
      }
    })
    const pctSmall = buttons.length > 0 ? smallCount / buttons.length : 0
    r.push({
      id: 'touch-targets',
      label: 'Touch-friendly tap targets (44px+)',
      status: pctSmall < 0.1 ? 'pass' : pctSmall < 0.3 ? 'partial' : 'fail',
      detail: `${Math.round(pctSmall * 100)}% of tap targets are undersized`,
      sfccValue: pctSmall < 0.1 ? undefined : 'Undersized tap targets cause mis-taps and frustration. Commerce Cloud\'s component library follows WCAG 2.1 AA touch target guidelines.',
    })

    // PWA / app banner
    const hasPWA =
      !!document.querySelector('link[rel="manifest"]') ||
      !!document.querySelector('[class*="app-banner"], [class*="smart-banner"], meta[name="apple-itunes-app"]')
    r.push({
      id: 'pwa',
      label: 'PWA install prompt or app banner',
      status: hasPWA ? 'pass' : 'fail',
      sfccValue: hasPWA ? undefined : 'PWA storefronts built on Commerce Cloud\'s Storefront Next deliver app-like performance with 2x faster load times and offline browsing capability.',
    })

    // Mobile checkout
    const hasMobileCheckout =
      !!document.querySelector('[class*="mobile-checkout"], [class*="express-checkout"]') ||
      bodyText.includes('apple pay') ||
      bodyText.includes('google pay')
    r.push({
      id: 'mobile-checkout',
      label: 'Mobile-optimized checkout flow',
      status: hasMobileCheckout ? 'pass' : 'partial',
      sfccValue: hasMobileCheckout ? undefined : 'Commerce Cloud Checkout is optimized for mobile with single-page checkout, autofill support, and native payment integration — reducing mobile checkout abandonment by 30%.',
    })

    return r
  })

  // Reset to desktop
  await page.setViewport({ width: 1280, height: 800 })
  return results
}
