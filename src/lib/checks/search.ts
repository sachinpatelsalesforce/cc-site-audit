import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkSearch(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const results: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []
    const bodyText = document.body.innerText.toLowerCase()

    // Autocomplete
    const hasAutocomplete =
      !!document.querySelector('[class*="autocomplete"], [class*="typeahead"], [class*="suggest"], [role="listbox"], [class*="search-suggest"]')
    results.push({
      id: 'autocomplete',
      label: 'Search autocomplete / typeahead',
      status: hasAutocomplete ? 'pass' : 'fail',
      sfccValue: hasAutocomplete ? undefined : "Einstein Search provides AI-powered autocomplete that surfaces relevant products as the shopper types — increasing search conversion by 35%.",
    })

    // Faceted filters
    const hasFacets =
      !!document.querySelector('[class*="facet"], [class*="filter"], [class*="refinement"]') ||
      !!document.querySelector('aside input[type="checkbox"]')
    results.push({
      id: 'faceted-search',
      label: 'Faceted / filtered search results',
      status: hasFacets ? 'pass' : 'fail',
      sfccValue: hasFacets ? undefined : "Commerce Cloud's search faceting allows shoppers to narrow results by size, color, price, and brand — reducing time-to-purchase.",
    })

    // Images + prices in results
    const resultItems = document.querySelectorAll('[class*="product-tile"], [class*="product-card"], [class*="search-result-item"]')
    const hasImagesInResults = resultItems.length > 0 && !!document.querySelector('[class*="product-tile"] img, [class*="product-card"] img')
    results.push({
      id: 'results-quality',
      label: 'Search results show images and prices',
      status: hasImagesInResults ? 'pass' : resultItems.length > 0 ? 'partial' : 'fail',
      sfccValue: hasImagesInResults ? undefined : "Commerce Cloud's search grid presents rich product tiles with imagery, pricing, and ratings — driving higher click-through from search.",
    })

    // No-results handling
    const hasNoResults =
      bodyText.includes('no results') || bodyText.includes('did you mean') || bodyText.includes('suggestions')
    results.push({
      id: 'no-results',
      label: 'No-results handling (alternative suggestions)',
      status: hasNoResults ? 'pass' : 'partial',
      sfccValue: hasNoResults ? undefined : "Einstein Search returns intelligent suggestions and alternative products, preventing dead ends that cause 68% of shoppers to leave.",
    })

    // Breadcrumbs
    const hasBreadcrumb =
      !!document.querySelector('[class*="breadcrumb"], [aria-label*="breadcrumb" i], nav ol, nav[aria-label]')
    results.push({
      id: 'breadcrumbs',
      label: 'Breadcrumb navigation',
      status: hasBreadcrumb ? 'pass' : 'fail',
    })

    // Mega menu
    const hasMegaMenu =
      !!document.querySelector('[class*="mega"], [class*="dropdown"] ul ul, nav [class*="menu"] ul')
    results.push({
      id: 'mega-menu',
      label: 'Mega menu / category navigation',
      status: hasMegaMenu ? 'pass' : 'partial',
      sfccValue: hasMegaMenu ? undefined : "Page Designer enables drag-and-drop mega menu creation with rich imagery and promotional spots — improving category discoverability.",
    })

    return results
  })
}
