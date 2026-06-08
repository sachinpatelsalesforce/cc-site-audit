import puppeteer, { Browser, Page } from 'puppeteer'

export interface CrawledPages {
  homepage: string
  plp?: string
  pdp?: string
  cart?: string
}

export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  })
}

export async function smartCrawl(browser: Browser, siteUrl: string): Promise<CrawledPages> {
  const normalized = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  const origin = new URL(normalized).origin

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36')
  await page.setViewport({ width: 1280, height: 800 })

  await page.goto(normalized, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.close()

  // Find PLP
  let plpUrl: string | undefined
  const plpPage = await browser.newPage()
  await plpPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36')
  await plpPage.setViewport({ width: 1280, height: 800 })
  try {
    await plpPage.goto(normalized, { waitUntil: 'domcontentloaded', timeout: 30000 })
    plpUrl = await plpPage.evaluate((origin: string) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'))
      const plpPatterns = /\/(category|collection|shop|products|c\/|l\/|catalog)/i
      const candidate = anchors.find(a => {
        const href = (a as HTMLAnchorElement).href
        return href.startsWith(origin) && plpPatterns.test(href)
      }) as HTMLAnchorElement | undefined
      return candidate?.href
    }, origin)
  } catch {}
  await plpPage.close()

  // Find PDP from PLP
  let pdpUrl: string | undefined
  if (plpUrl) {
    const pdpPage = await browser.newPage()
    await pdpPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36')
    await pdpPage.setViewport({ width: 1280, height: 800 })
    try {
      await pdpPage.goto(plpUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      pdpUrl = await pdpPage.evaluate((origin: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'))
        const pdpPatterns = /\/(product|item|p\/|pd\/|detail|pdp)/i
        const candidate = anchors.find(a => {
          const href = (a as HTMLAnchorElement).href
          return href.startsWith(origin) && pdpPatterns.test(href)
        }) as HTMLAnchorElement | undefined
        return candidate?.href
      }, origin)
    } catch {}
    await pdpPage.close()
  }

  // Find cart
  let cartUrl: string | undefined
  const cartPage = await browser.newPage()
  await cartPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36')
  await cartPage.setViewport({ width: 1280, height: 800 })
  try {
    await cartPage.goto(normalized, { waitUntil: 'domcontentloaded', timeout: 30000 })
    cartUrl = await cartPage.evaluate((origin: string) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'))
      const cartPatterns = /\/(cart|basket|bag|trolley)/i
      const candidate = anchors.find(a => {
        const href = (a as HTMLAnchorElement).href
        return href.startsWith(origin) && cartPatterns.test(href)
      }) as HTMLAnchorElement | undefined
      if (candidate) return candidate.href
      // Try direct guesses
      const guesses = ['/cart', '/basket', '/bag']
      return guesses.map(g => origin + g).find(() => true)
    }, origin)
  } catch {}
  await cartPage.close()

  return {
    homepage: normalized,
    plp: plpUrl,
    pdp: pdpUrl,
    cart: cartUrl,
  }
}

export async function loadPage(browser: Browser, url: string): Promise<Page> {
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36')
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  // Brief wait for dynamic content
  await new Promise(r => setTimeout(r, 1500))
  return page
}
