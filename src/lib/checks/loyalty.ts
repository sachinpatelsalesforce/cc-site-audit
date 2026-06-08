import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkLoyalty(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const r: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []
    const bodyText = document.body.innerText.toLowerCase()
    const allLinks = Array.from(document.querySelectorAll('a')).map(a => a.textContent?.toLowerCase() || '')

    // Loyalty / rewards
    const hasLoyalty =
      bodyText.includes('loyalty') ||
      bodyText.includes('rewards') ||
      bodyText.includes('points') ||
      bodyText.includes('member') ||
      allLinks.some(l => l.includes('reward') || l.includes('loyalty'))
    r.push({
      id: 'loyalty-program',
      label: 'Loyalty / rewards program visible',
      status: hasLoyalty ? 'pass' : 'fail',
      sfccValue: hasLoyalty ? undefined : 'Loyalty Management on the Salesforce Platform integrates natively with Commerce Cloud — loyalty members spend 67% more than non-members.',
    })

    // Wishlist
    const hasWishlist =
      bodyText.includes('wishlist') ||
      bodyText.includes('wish list') ||
      bodyText.includes('save for later') ||
      bodyText.includes('favorites') ||
      !!document.querySelector('[class*="wishlist"], [aria-label*="wishlist" i]')
    r.push({
      id: 'wishlist',
      label: 'Wishlist functionality',
      status: hasWishlist ? 'pass' : 'fail',
      sfccValue: hasWishlist ? undefined : 'Commerce Cloud\'s native wishlist syncs across devices and integrates with Marketing Cloud for "back in stock" and "price drop" email triggers.',
    })

    // Email capture
    const hasEmailCapture =
      !!document.querySelector('input[type="email"], form[class*="newsletter"], [class*="email-signup"], [class*="subscribe"]')
    r.push({
      id: 'email-capture',
      label: 'Newsletter / email capture',
      status: hasEmailCapture ? 'pass' : 'fail',
      sfccValue: hasEmailCapture ? undefined : 'Email remains the highest-ROI marketing channel. Commerce Cloud + Marketing Cloud enables seamless list growth with segmentation from day one.',
    })

    // Account features
    const hasAccount =
      bodyText.includes('my account') ||
      bodyText.includes('order history') ||
      bodyText.includes('sign in') ||
      bodyText.includes('log in') ||
      !!document.querySelector('[class*="account"], [href*="account"], [href*="login"]')
    r.push({
      id: 'account-features',
      label: 'Customer account (order history, saved addresses)',
      status: hasAccount ? 'pass' : 'fail',
      sfccValue: hasAccount ? undefined : 'Commerce Cloud\'s shopper identity model enables unified profiles — combining purchase history, browse behavior, and loyalty data for personalized experiences.',
    })

    // Social proof
    const hasSocialProof =
      bodyText.includes('people viewing') ||
      bodyText.includes('in cart') ||
      bodyText.includes('sold today') ||
      bodyText.includes('customers also') ||
      !!document.querySelector('[class*="social-proof"], [class*="urgency"]')
    r.push({
      id: 'social-proof',
      label: 'Social proof elements ("X people viewing")',
      status: hasSocialProof ? 'pass' : 'fail',
      sfccValue: hasSocialProof ? undefined : 'Real-time social proof widgets (powered by Commerce Cloud\'s activity stream) create urgency and validate purchasing decisions — increasing conversion by 10–15%.',
    })

    return r
  })
}
