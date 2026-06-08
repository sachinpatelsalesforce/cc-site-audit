import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkPDP(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const results: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []
    const bodyText = document.body.innerText.toLowerCase()

    // Multiple images / zoom
    const imageCount = document.querySelectorAll('[class*="product-image"] img, [class*="gallery"] img, [class*="pdp"] img').length
    results.push({
      id: 'product-images',
      label: 'High-quality images (zoom, multiple angles)',
      status: imageCount > 2 ? 'pass' : imageCount > 0 ? 'partial' : 'fail',
      detail: imageCount + ' product images found',
      sfccValue: imageCount > 2 ? undefined : "Commerce Cloud supports up to 16 product angles with built-in zoom — rich imagery reduces return rates by 22% and increases conversion.",
    })

    // Product video
    const hasVideo = !!document.querySelector('video, [class*="video"], iframe[src*="youtube"], iframe[src*="vimeo"]')
    results.push({
      id: 'product-video',
      label: 'Product video',
      status: hasVideo ? 'pass' : 'fail',
      sfccValue: hasVideo ? undefined : "Product videos increase conversion rates by up to 80%. Commerce Cloud supports native video hosting with adaptive streaming.",
    })

    // Variant selector
    const hasVariants =
      !!document.querySelector('[class*="swatch"], [class*="variant"], [class*="size-selector"], [class*="color-selector"], select[class*="size"], select[class*="color"]')
    results.push({
      id: 'variant-selector',
      label: 'Variant selector (size, color, etc.)',
      status: hasVariants ? 'pass' : 'fail',
      sfccValue: hasVariants ? undefined : "Commerce Cloud's variant model supports unlimited product attributes with visual swatches — reducing sizing-related returns by 15%.",
    })

    // Stock indicator
    const hasStock =
      bodyText.includes('in stock') ||
      bodyText.includes('out of stock') ||
      bodyText.includes('low stock') ||
      bodyText.includes('only') ||
      !!document.querySelector('[class*="availability"], [class*="stock"], [class*="inventory"]')
    results.push({
      id: 'stock-indicator',
      label: 'Stock / availability indicator',
      status: hasStock ? 'pass' : 'fail',
      sfccValue: hasStock ? undefined : "Real-time inventory visibility powered by Commerce Cloud reduces disappointed customers and drives urgency when stock is low — a key conversion lever.",
    })

    // Reviews & ratings
    const hasReviews =
      !!document.querySelector('[class*="review"], [class*="rating"], [itemprop="ratingValue"], [class*="stars"]')
    results.push({
      id: 'reviews-ratings',
      label: 'Customer reviews & ratings',
      status: hasReviews ? 'pass' : 'fail',
      sfccValue: hasReviews ? undefined : "88% of consumers trust online reviews as much as personal recommendations. Commerce Cloud integrates with PowerReviews and Bazaarvoice natively.",
    })

    // Recommendations
    const hasRecs =
      !!document.querySelector('[class*="recommend"], [class*="related"], [class*="you-may"], [class*="similar"], [class*="upsell"], [class*="cross-sell"]')
    results.push({
      id: 'pdp-recommendations',
      label: '"You may also like" recommendations',
      status: hasRecs ? 'pass' : 'fail',
      sfccValue: hasRecs ? undefined : "Einstein Product Recommendations on the PDP increases AOV by 15-30% through AI-driven cross-sell and upsell suggestions.",
    })

    // Social sharing
    const hasShare =
      !!document.querySelector('[class*="share"], [aria-label*="share" i], a[href*="pinterest"], a[href*="facebook"], a[href*="twitter"]')
    results.push({
      id: 'social-sharing',
      label: 'Social sharing',
      status: hasShare ? 'pass' : 'fail',
    })

    // Delivery estimate
    const hasDelivery =
      bodyText.includes('delivery') ||
      bodyText.includes('ships') ||
      bodyText.includes('estimated') ||
      bodyText.includes('arrives')
    results.push({
      id: 'delivery-estimate',
      label: 'Delivery estimate shown',
      status: hasDelivery ? 'pass' : 'fail',
      sfccValue: hasDelivery ? undefined : "Displaying delivery estimates on the PDP reduces cart abandonment — 26% of shoppers leave because they don't know when items will arrive. Commerce Cloud integrates with carrier APIs in real-time.",
    })

    return results
  })
}
