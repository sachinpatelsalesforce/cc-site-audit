import puppeteer, { Browser, Page } from 'puppeteer'

export interface CrawledPages {
  homepage: string
  plp?: string
  pdp?: string
  cart?: string
}

export async function launchBrowser(): Promise<Browser> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  return puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  })
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'

async function openPage(browser: Browser, url: string): Promise<Page> {
  const page = await browser.newPage()
  await page.setUserAgent(UA)
  await page.setViewport({ width: 1280, height: 800 })
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  } catch {
    // timeout or navigation error — still try to use what loaded
  }
  return page
}

// Paths that are definitely NOT product listing pages
const SKIP_PATTERNS = /\/(login|signin|signup|register|account|help|support|faq|contact|about|careers|press|legal|privacy|terms|sitemap|blog|news|store-locator|gift-card|wish|wishlist|compare|404|error|search)/i

// Patterns that strongly suggest a product category / listing page
const PLP_STRONG = /\/(category|categories|collection|collections|shop|products|catalog|browse|department|dept|range|section|gender|womens?|mens?|kids?|children|beauty|home|furniture|accessories|clothing|shoes|bags|jewellery|jewelry|watches|sport|tech|toys|food|electricals|lifestyle)/i

export async function smartCrawl(browser: Browser, siteUrl: string): Promise<CrawledPages> {
  const normalized = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  const origin = new URL(normalized).origin

  // ── 1. Load homepage and extract all same-origin links ──────────────────────
  const homePage = await openPage(browser, normalized)

  const allLinks: string[] = await homePage.evaluate((origin: string) => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => (a as HTMLAnchorElement).href)
      .filter(h => h.startsWith(origin) && !h.includes('#') && !h.includes('javascript:'))
      .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe
      .slice(0, 200)
  }, origin)

  await homePage.close()

  // ── 2. Find cart URL ─────────────────────────────────────────────────────────
  const cartPatterns = /\/(cart|basket|bag|trolley|checkout)/i
  let cartUrl: string | undefined =
    allLinks.find(h => cartPatterns.test(new URL(h).pathname)) ??
    (['/cart', '/basket', '/bag', '/trolley'].map(p => origin + p)[0])

  // ── 3. Find PLP candidates ────────────────────────────────────────────────────
  // Priority 1: links matching strong PLP patterns
  const strongCandidates = allLinks.filter(h => {
    const path = new URL(h).pathname
    return PLP_STRONG.test(path) && !SKIP_PATTERNS.test(path) && path !== '/'
  })

  // Priority 2: any same-origin link with a meaningful path (2+ segments), not skippable
  const weakCandidates = allLinks.filter(h => {
    const path = new URL(h).pathname
    const segments = path.split('/').filter(Boolean)
    return segments.length >= 1 && !SKIP_PATTERNS.test(path) && path !== '/'
  })

  const plpCandidates = [...new Set([...strongCandidates, ...weakCandidates])].slice(0, 8)

  // ── 4. Verify PLP candidates by counting product links ───────────────────────
  const pdpPatterns = /\/(product|item|p\/|pd\/|detail|pdp|sku|prod)/i
  // Also accept numeric-heavy paths as product URLs (e.g. /en/product-name-123456/)
  const looksLikePdp = (href: string) => {
    const path = new URL(href).pathname
    return pdpPatterns.test(path) || /\/[a-z0-9-]+-\d{4,}(\/|$)/i.test(path)
  }

  let plpUrl: string | undefined
  let pdpUrl: string | undefined

  for (const candidate of plpCandidates) {
    let page: Page | undefined
    try {
      page = await openPage(browser, candidate)
      const { productLinks, pageLinks } = await page.evaluate((origin: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'))
          .map(a => (a as HTMLAnchorElement).href)
          .filter(h => h.startsWith(origin))
        return {
          productLinks: anchors.filter(h => {
            const path = new URL(h).pathname
            return /\/(product|item|p\/|pd\/|detail|pdp|sku|prod)/i.test(path) ||
              /\/[a-z0-9-]+-\d{4,}(\/|$)/i.test(path)
          }),
          pageLinks: anchors,
        }
      }, origin)

      if (productLinks.length >= 2) {
        plpUrl = candidate
        pdpUrl = productLinks[0]
        await page.close()
        break
      }

      // Looser fallback: if this page has lots of internal links (likely a category)
      if (!plpUrl && pageLinks.length > 20) {
        plpUrl = candidate
      }
    } catch {
      // skip
    } finally {
      if (page && !page.isClosed()) await page.close()
    }
  }

  // ── 5. If we have a PLP but no PDP yet, try finding PDP from it ──────────────
  if (plpUrl && !pdpUrl) {
    let page: Page | undefined
    try {
      page = await openPage(browser, plpUrl)
      pdpUrl = await page.evaluate((origin: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'))
          .map(a => (a as HTMLAnchorElement).href)
          .filter(h => h.startsWith(origin))
        return anchors.find(h => {
          const path = new URL(h).pathname
          return /\/(product|item|p\/|pd\/|detail|pdp|sku|prod)/i.test(path) ||
            /\/[a-z0-9-]+-\d{4,}(\/|$)/i.test(path)
        })
      }, origin)
    } catch {}
    if (page && !page.isClosed()) await page.close()
  }

  return {
    homepage: normalized,
    plp: plpUrl,
    pdp: pdpUrl,
    cart: cartUrl,
  }
}

export async function loadPage(browser: Browser, url: string): Promise<Page> {
  const page = await browser.newPage()
  await page.setUserAgent(UA)
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise(r => setTimeout(r, 1500))
  return page
}
