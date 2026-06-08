import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkPLP(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const results: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []

    // Filter & sort controls
    const hasFilters =
      !!document.querySelector('[class*="filter"], [class*="facet"], [class*="sort"], select[class*="sort"], [class*="refinement"]')
    results.push({
      id: 'plp-filters',
      label: 'Filter & sort controls',
      status: hasFilters ? 'pass' : 'fail',
      sfccValue: hasFilters ? undefined : "Commerce Cloud's native faceting and sort controls help shoppers narrow 1,000s of products to exactly what they want — lifting conversion 25%.",
    })

    // Quick view
    const hasQuickView =
      !!document.querySelector('[class*="quick-view"], [class*="quickview"], [data-*="quick"]')
    results.push({
      id: 'quick-view',
      label: 'Quick view modal',
      status: hasQuickView ? 'pass' : 'fail',
      sfccValue: hasQuickView ? undefined : "Quick view reduces page navigation and enables shoppers to add to cart without losing their browsing context — increasing add-to-cart rates.",
    })

    // Image swap on hover
    const tiles = document.querySelectorAll('[class*="product-tile"], [class*="product-card"]')
    const hasHoverImages = Array.from(tiles).some(function(t) { return t.querySelectorAll('img').length > 1 })
    results.push({
      id: 'hover-image',
      label: 'Product image swap on hover',
      status: hasHoverImages ? 'pass' : 'fail',
      sfccValue: hasHoverImages ? undefined : "Hover-swap imagery lets shoppers preview color variants without clicking through — reducing unnecessary PDP visits and improving browse-to-buy flow.",
    })

    // Pagination or infinite scroll
    const hasPagination =
      !!document.querySelector('[class*="pagination"], [class*="page-numbers"], [aria-label*="pagination" i]') ||
      document.querySelectorAll('a[href*="page="]').length > 0
    const hasInfiniteScroll =
      !!document.querySelector('[class*="infinite"], [class*="load-more"]')
    results.push({
      id: 'pagination',
      label: 'Pagination or infinite scroll',
      status: (hasPagination || hasInfiniteScroll) ? 'pass' : 'fail',
    })

    // Product badges
    const hasBadges =
      !!document.querySelector('[class*="badge"], [class*="tag"], [class*="label"], [class*="sticker"]') &&
      (document.body.innerText.toLowerCase().includes('sale') ||
        document.body.innerText.toLowerCase().includes('new') ||
        document.body.innerText.toLowerCase().includes('best'))
    results.push({
      id: 'product-badges',
      label: 'Product badges (sale, new, bestseller)',
      status: hasBadges ? 'pass' : 'partial',
      sfccValue: hasBadges ? undefined : "Automated promotional badges powered by Commerce Cloud rules drive urgency — shoppers are 2x more likely to click products with Sale or Limited badges.",
    })

    // Wishlist from listing
    const hasWishlistOnListing =
      !!document.querySelector('[class*="wishlist"] button, button[class*="wishlist"], [class*="save"] button, [aria-label*="wishlist" i], [aria-label*="save" i]')
    results.push({
      id: 'wishlist-listing',
      label: 'Wishlist / save from listing',
      status: hasWishlistOnListing ? 'pass' : 'fail',
      sfccValue: hasWishlistOnListing ? undefined : "Native wishlist functionality in Commerce Cloud keeps shoppers engaged and creates retargeting opportunities — saved items have 40% higher purchase intent.",
    })

    return results
  })
}
