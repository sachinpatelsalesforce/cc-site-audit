import { prisma } from './db'
import { launchBrowser, smartCrawl, loadPage } from './crawler'
import { checkHomepage } from './checks/homepage'
import { checkSearch } from './checks/search'
import { checkPLP } from './checks/plp'
import { checkPDP } from './checks/pdp'
import { checkCart } from './checks/cart'
import { checkPersonalization } from './checks/personalization'
import { checkMobile } from './checks/mobile'
import { checkPerformance } from './checks/performance'
import { checkSEO } from './checks/seo'
import { checkLoyalty } from './checks/loyalty'
import { scoreCategory, overallScore, scoreToGrade, extractOpportunities } from './scoring'
import type { AuditResult, CategoryResult } from '@/types/audit'

async function setProgress(id: string, progress: number, currentStep: string) {
  await prisma.audit.update({
    where: { id },
    data: { progress, currentStep },
  })
}

export async function runAudit(auditId: string, siteUrl: string) {
  let browser
  try {
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'running', progress: 0, currentStep: 'Starting crawl…' },
    })

    browser = await launchBrowser()

    await setProgress(auditId, 5, 'Discovering site pages…')
    const crawled = await smartCrawl(browser, siteUrl)

    await setProgress(auditId, 15, 'Auditing homepage…')
    const homePage = await loadPage(browser, crawled.homepage)
    const homepageChecks = await checkHomepage(homePage)
    const seoChecks = await checkSEO(homePage)
    const personalizationChecks = await checkPersonalization(homePage)
    const loyaltyChecks = await checkLoyalty(homePage)
    await homePage.close()

    await setProgress(auditId, 30, 'Testing search & navigation…')
    const searchPage = await loadPage(browser, crawled.homepage)
    const searchChecks = await checkSearch(searchPage)
    await searchPage.close()

    await setProgress(auditId, 45, 'Checking product listing pages…')
    let plpChecks: CategoryResult['checks'] = []
    if (crawled.plp) {
      const plpPage = await loadPage(browser, crawled.plp)
      plpChecks = await checkPLP(plpPage)
      await plpPage.close()
    } else {
      plpChecks = stubChecks('plp')
    }

    await setProgress(auditId, 58, 'Analysing product detail pages…')
    let pdpChecks: CategoryResult['checks'] = []
    if (crawled.pdp) {
      const pdpPage = await loadPage(browser, crawled.pdp)
      pdpChecks = await checkPDP(pdpPage)
      await pdpPage.close()
    } else {
      pdpChecks = stubChecks('pdp')
    }

    await setProgress(auditId, 70, 'Reviewing cart & checkout…')
    let cartChecks: CategoryResult['checks'] = []
    if (crawled.cart) {
      try {
        const cartPage = await loadPage(browser, crawled.cart)
        cartChecks = await checkCart(cartPage)
        await cartPage.close()
      } catch {
        cartChecks = stubChecks('cart')
      }
    } else {
      cartChecks = stubChecks('cart')
    }

    await setProgress(auditId, 80, 'Testing mobile experience…')
    const mobilePage = await loadPage(browser, crawled.homepage)
    const mobileChecks = await checkMobile(mobilePage)
    await mobilePage.close()

    await setProgress(auditId, 88, 'Measuring performance…')
    const perfPage = await loadPage(browser, crawled.homepage)
    const perfChecks = await checkPerformance(perfPage)
    await perfPage.close()

    await setProgress(auditId, 95, 'Calculating scores…')

    const categories: CategoryResult[] = [
      build('homepage', 'Homepage Experience', '🏠', homepageChecks),
      build('search', 'Search & Navigation', '🔍', searchChecks),
      build('plp', 'Product Listing Pages', '📋', plpChecks),
      build('pdp', 'Product Detail Pages', '📦', pdpChecks),
      build('cart', 'Cart & Checkout', '🛒', cartChecks),
      build('personalization', 'Personalization & AI', '🤖', personalizationChecks),
      build('mobile', 'Mobile Experience', '📱', mobileChecks),
      build('performance', 'Performance', '⚡', perfChecks),
      build('seo', 'SEO & Discovery', '🎯', seoChecks),
      build('loyalty', 'Loyalty & Engagement', '⭐', loyaltyChecks),
    ]

    const overall = overallScore(categories)
    const grade = scoreToGrade(overall)
    const topOpportunities = extractOpportunities(categories)

    const result: AuditResult = {
      overallScore: overall,
      grade,
      siteUrl,
      crawledPages: {
        homepage: crawled.homepage,
        plp: crawled.plp,
        pdp: crawled.pdp,
        cart: crawled.cart,
      },
      categories,
      topOpportunities,
      completedAt: new Date().toISOString(),
    }

    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'complete', progress: 100, currentStep: 'Done', results: result as object },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'error', errorMessage: msg, currentStep: 'Error' },
    })
  } finally {
    if (browser) await browser.close()
  }
}

function build(id: string, name: string, icon: string, checks: CategoryResult['checks']): CategoryResult {
  const cat: CategoryResult = { id, name, icon, score: 0, maxScore: checks.length * 2, checks }
  cat.score = scoreCategory(cat)
  return cat
}

function stubChecks(type: string): CategoryResult['checks'] {
  const stubs: Record<string, { id: string; label: string; sfccValue?: string }[]> = {
    plp: [
      { id: 'plp-filters', label: 'Filter & sort controls', sfccValue: "Commerce Cloud's native faceting and sort controls help shoppers narrow results, lifting conversion by 25%." },
      { id: 'quick-view', label: 'Quick view modal', sfccValue: "Quick view reduces friction and enables add-to-cart without losing browse context." },
      { id: 'hover-image', label: 'Product image swap on hover' },
      { id: 'pagination', label: 'Pagination or infinite scroll' },
      { id: 'product-badges', label: 'Product badges (sale, new, bestseller)' },
      { id: 'wishlist-listing', label: 'Wishlist / save from listing', sfccValue: "Native wishlist functionality creates retargeting opportunities — saved items have 40% higher purchase intent." },
    ],
    pdp: [
      { id: 'product-images', label: 'High-quality images (zoom, multiple angles)', sfccValue: "Commerce Cloud supports up to 16 product angles with built-in zoom — reducing return rates by 22%." },
      { id: 'product-video', label: 'Product video', sfccValue: "Product videos increase conversion rates by up to 80%." },
      { id: 'variant-selector', label: 'Variant selector (size, color, etc.)' },
      { id: 'stock-indicator', label: 'Stock / availability indicator' },
      { id: 'reviews-ratings', label: 'Customer reviews & ratings', sfccValue: "88% of consumers trust online reviews as much as personal recommendations." },
      { id: 'pdp-recommendations', label: '"You may also like" recommendations', sfccValue: "Einstein Recommendations on the PDP increases AOV by 15-30%." },
      { id: 'social-sharing', label: 'Social sharing' },
      { id: 'delivery-estimate', label: 'Delivery estimate shown' },
    ],
    cart: [
      { id: 'guest-checkout', label: 'Guest checkout available', sfccValue: "34% of shoppers abandon when forced to create an account." },
      { id: 'coupon-code', label: 'Promo / coupon code field' },
      { id: 'multi-payment', label: 'Multiple payment methods', sfccValue: "Commerce Cloud integrates with 40+ payment providers via the LINK marketplace." },
      { id: 'digital-wallets', label: 'Apple Pay / Google Pay', sfccValue: "Digital wallet checkout reduces checkout time to under 30 seconds." },
      { id: 'order-summary', label: 'Order summary visible' },
      { id: 'address-autocomplete', label: 'Address autocomplete' },
    ],
  }
  return (stubs[type] || []).map(s => ({ ...s, status: 'fail' as const, detail: 'Page not found during crawl' }))
}
