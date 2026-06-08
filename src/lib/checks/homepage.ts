import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkHomepage(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const results: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []

    // Hero banner / promotional content
    const hasBanner =
      !!document.querySelector('[class*="banner"], [class*="hero"], [class*="carousel"], [class*="slider"], [class*="promo"]') ||
      !!document.querySelector('section img, .hero, .banner')
    results.push({
      id: 'hero-banner',
      label: 'Hero banner / promotional content',
      status: hasBanner ? 'pass' : 'fail',
      sfccValue: hasBanner ? undefined : 'Einstein Recommendations & Page Designer enable dynamic, targeted hero banners with A/B testing — increasing click-through rates by up to 20%.',
    })

    // Personalized recommendations
    const hasRecs =
      !!document.querySelector('[class*="recommend"], [class*="personali"], [class*="suggested"], [class*="for-you"]')
    results.push({
      id: 'homepage-recommendations',
      label: 'Personalized product recommendations',
      status: hasRecs ? 'pass' : 'fail',
      sfccValue: hasRecs ? undefined : 'Einstein Product Recommendations delivers AI-driven personalization shown to increase AOV by 15–30%.',
    })

    // Search bar
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[name*="search" i], [role="search"] input')
    results.push({
      id: 'search-bar',
      label: 'Prominent search bar',
      status: searchInput ? 'pass' : 'fail',
      sfccValue: searchInput ? undefined : 'Einstein Search delivers predictive search with AI-powered autocomplete — reducing zero-result searches by 40%.',
    })

    // Category navigation
    const hasCategories =
      document.querySelectorAll('nav a, header a').length > 3
    results.push({
      id: 'category-nav',
      label: 'Featured categories navigation',
      status: hasCategories ? 'pass' : 'partial',
    })

    // Trust signals
    const trustText = document.body.innerText.toLowerCase()
    const hasTrust =
      trustText.includes('review') ||
      trustText.includes('secure') ||
      trustText.includes('ssl') ||
      !!document.querySelector('[class*="trust"], [class*="rating"], [class*="review"]')
    results.push({
      id: 'trust-signals',
      label: 'Trust signals (reviews, security badges)',
      status: hasTrust ? 'pass' : 'fail',
      sfccValue: hasTrust ? undefined : 'Salesforce Commerce Cloud integrates with leading review platforms and displays trust badges natively — reducing bounce rates on landing pages.',
    })

    // Live chat
    const hasChat =
      !!document.querySelector('[class*="chat"], [id*="chat"], [class*="livechat"], [id*="livechat"], [class*="intercom"], [id*="intercom"], iframe[src*="chat"]')
    results.push({
      id: 'live-chat',
      label: 'Live chat / support widget',
      status: hasChat ? 'pass' : 'fail',
      sfccValue: hasChat ? undefined : 'Service Cloud integration with Commerce enables embedded live chat, reducing cart abandonment by surfacing help at critical moments.',
    })

    return results
  })
}
