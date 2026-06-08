import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkPersonalization(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const results: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []
    const bodyText = document.body.innerText.toLowerCase()

    // Recommendations engine visible
    const hasRecs =
      !!document.querySelector('[class*="recommend"], [class*="personali"], [class*="for-you"], [class*="suggested"]')
    results.push({
      id: 'recs-engine',
      label: 'Product recommendations engine visible',
      status: hasRecs ? 'pass' : 'fail',
      sfccValue: hasRecs ? undefined : 'Einstein Product Recommendations uses AI to surface the right product to the right shopper — customers who click recommendations are 4.5x more likely to purchase.',
    })

    // Recently viewed
    const hasRecentlyViewed =
      bodyText.includes('recently viewed') ||
      bodyText.includes('recently seen') ||
      !!document.querySelector('[class*="recently-viewed"], [class*="recent-items"]')
    results.push({
      id: 'recently-viewed',
      label: 'Recently viewed products',
      status: hasRecentlyViewed ? 'pass' : 'fail',
      sfccValue: hasRecentlyViewed ? undefined : 'Recently viewed widgets recapture browse sessions — Commerce Cloud stores session history and surfaces it across devices with shopper identity resolution.',
    })

    // Personalized content
    const hasPersonalContent =
      !!document.querySelector('[class*="personali"], [data-segment], [data-campaign]') ||
      bodyText.includes('based on your') ||
      bodyText.includes('picked for you')
    results.push({
      id: 'personalized-content',
      label: 'Personalized content based on browse history',
      status: hasPersonalContent ? 'pass' : 'fail',
      sfccValue: hasPersonalContent ? undefined : 'Einstein Behavioral Targeting enables real-time content personalization — personalized homepages lift engagement by 55% vs. one-size-fits-all.',
    })

    // Dynamic banners / targeted promos
    const hasDynamicBanners =
      !!document.querySelector('[class*="targeted"], [class*="dynamic-banner"], [data-slot]') ||
      !!document.querySelector('[class*="campaign"]')
    results.push({
      id: 'dynamic-banners',
      label: 'Dynamic banners / targeted promotions',
      status: hasDynamicBanners ? 'partial' : 'fail',
      sfccValue: 'Page Designer + Einstein enables merchandisers to publish targeted promotions by segment, geography, or behavior — no developer required.',
    })

    // Abandoned cart signals
    const hasAbandonedCart =
      bodyText.includes('left in your cart') ||
      bodyText.includes('items in your bag') ||
      bodyText.includes('saved for later')
    results.push({
      id: 'abandoned-cart-signals',
      label: 'Abandoned cart recovery signals',
      status: hasAbandonedCart ? 'pass' : 'fail',
      sfccValue: hasAbandonedCart ? undefined : 'Marketing Cloud + Commerce Cloud triggers automated abandoned cart emails within 1 hour of abandonment — recovering an average of 5–15% of lost revenue.',
    })

    return results
  })
}
