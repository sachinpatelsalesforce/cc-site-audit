export interface TechItem {
  name: string
  category: string
  confidence: 'high' | 'medium' | 'low'
  sfccOpportunity?: string
}

export interface TechStackResult {
  technologies: TechItem[]
  categories: Record<string, TechItem[]>
}

// ─── Fingerprint rules ────────────────────────────────────────────────────────
// Each rule: match against html (lowercase), headers, or script src list
interface Rule {
  name: string
  category: string
  confidence: 'high' | 'medium' | 'low'
  sfccOpportunity?: string
  html?: RegExp[]      // match against full HTML text
  scripts?: RegExp[]   // match against script src attributes
  headers?: { name: string; pattern?: RegExp }[]  // response headers
  cookies?: RegExp[]   // Set-Cookie header
}

const RULES: Rule[] = [
  // ── Ecommerce Platforms ──────────────────────────────────────────────────
  {
    name: 'Shopify',
    category: 'Ecommerce Platform',
    confidence: 'high',
    sfccOpportunity: 'Shopify lacks enterprise-grade B2C/B2B capabilities, headless flexibility, and AI-native features. SFCC handles 10x the SKU volume with native Einstein AI, Order Management, and Loyalty.',
    html: [/cdn\.shopify\.com/i, /shopify\.com\/s\/files/i, /"shop_id"/i],
    scripts: [/cdn\.shopify\.com/i],
    headers: [{ name: 'x-shopify-stage' }, { name: 'x-shopid' }],
  },
  {
    name: 'Magento / Adobe Commerce',
    category: 'Ecommerce Platform',
    confidence: 'high',
    sfccOpportunity: 'Magento/Adobe Commerce has high TCO and complex upgrades. SFCC offers a fully managed cloud with automatic upgrades, native AI, and a richer AppExchange ecosystem.',
    html: [/mage\/cookies/i, /magento\/module/i, /requirejs\/require\.js/i, /\/static\/version\d+\/frontend/i],
    scripts: [/mage\//i, /magento/i],
  },
  {
    name: 'WooCommerce',
    category: 'Ecommerce Platform',
    confidence: 'high',
    sfccOpportunity: 'WooCommerce is built for SMB. SFCC provides enterprise scalability, global multi-site, native promotions engine, and AI — without the plugin fragility.',
    html: [/woocommerce/i, /wp-content\/plugins\/woocommerce/i],
    scripts: [/woocommerce/i],
  },
  {
    name: 'Salesforce Commerce Cloud',
    category: 'Ecommerce Platform',
    confidence: 'high',
    html: [/demandware/i, /salesforcecommercecloud/i, /dwcont/i, /dw\.ac\(/i, /sfcc/i],
    scripts: [/demandware/i],
    headers: [{ name: 'x-dw-request-id' }],
  },
  {
    name: 'BigCommerce',
    category: 'Ecommerce Platform',
    confidence: 'high',
    sfccOpportunity: 'BigCommerce has limited internationalisation and B2B depth. SFCC offers native multi-currency, multi-locale, and a full B2B Commerce suite.',
    html: [/bigcommerce\.com/i, /cdn\d+\.bigcommerce\.com/i],
    scripts: [/bigcommerce/i],
    headers: [{ name: 'x-bc-apiver' }],
  },
  {
    name: 'SAP Commerce Cloud',
    category: 'Ecommerce Platform',
    confidence: 'high',
    sfccOpportunity: 'SAP Commerce has high implementation cost and long time-to-market. SFCC offers faster deployment, richer AI, and the Salesforce Customer 360 ecosystem.',
    html: [/hybris/i, /sap-commerce/i, /acceleratorstorefrontcommons/i],
    scripts: [/hybris/i],
  },
  {
    name: 'VTEX',
    category: 'Ecommerce Platform',
    confidence: 'high',
    sfccOpportunity: 'VTEX is strong in LATAM but has limited AI and headless maturity. SFCC + Agentforce offers superior AI commerce and a global partner network.',
    html: [/vtex\.com/i, /vteximg\.com\.br/i, /\/api\/catalog/i],
    scripts: [/vtex/i],
  },
  {
    name: 'PrestaShop',
    category: 'Ecommerce Platform',
    confidence: 'medium',
    sfccOpportunity: 'PrestaShop is SMB-focused with limited scalability. SFCC is the natural next step for growing retailers needing enterprise features.',
    html: [/prestashop/i, /\/modules\/prestashop/i],
  },
  {
    name: 'OpenCart',
    category: 'Ecommerce Platform',
    confidence: 'medium',
    sfccOpportunity: 'OpenCart lacks scalability and enterprise features. SFCC offers enterprise-grade commerce with native AI and full Salesforce ecosystem integration.',
    html: [/opencart/i, /catalog\/view\/theme/i],
  },

  // ── CMS ──────────────────────────────────────────────────────────────────
  {
    name: 'WordPress',
    category: 'CMS',
    confidence: 'high',
    html: [/wp-content\//i, /wp-includes\//i, /wordpress/i],
    scripts: [/wp-content\//i, /wp-includes\//i],
  },
  {
    name: 'Drupal',
    category: 'CMS',
    confidence: 'high',
    html: [/drupal\.js/i, /drupal\.settings/i, /sites\/default\/files/i],
    headers: [{ name: 'x-generator', pattern: /drupal/i }],
  },
  {
    name: 'Contentful',
    category: 'CMS',
    confidence: 'medium',
    html: [/ctfassets\.net/i, /contentful/i],
    scripts: [/contentful/i],
  },
  {
    name: 'Contentstack',
    category: 'CMS',
    confidence: 'medium',
    html: [/contentstack/i, /app\.contentstack\.com/i],
  },

  // ── Search ───────────────────────────────────────────────────────────────
  {
    name: 'Algolia',
    category: 'Search',
    confidence: 'high',
    sfccOpportunity: 'Algolia is a third-party integration adding cost and complexity. Einstein Search is natively embedded in SFCC with AI ranking, personalisation, and zero integration overhead.',
    html: [/algolia/i, /algoliainsights/i],
    scripts: [/algolia/i, /algoliasearch/i],
  },
  {
    name: 'Coveo',
    category: 'Search',
    confidence: 'high',
    sfccOpportunity: 'Coveo is a separate platform requiring integration. Einstein Search provides AI-native search natively within SFCC, reducing vendor sprawl.',
    html: [/coveo/i, /coveo\.analytics/i],
    scripts: [/coveo/i],
  },
  {
    name: 'Searchspring',
    category: 'Search',
    confidence: 'high',
    sfccOpportunity: 'Searchspring adds a third-party dependency. Einstein Search is built into SFCC with native product catalog integration.',
    html: [/searchspring/i, /searchspring\.net/i],
    scripts: [/searchspring/i],
  },
  {
    name: 'Klevu',
    category: 'Search',
    confidence: 'high',
    sfccOpportunity: 'Klevu is a bolt-on search solution. Einstein Search provides equivalent AI-powered search natively within SFCC.',
    html: [/klevu/i, /js\.klevu\.com/i],
    scripts: [/klevu/i],
  },
  {
    name: 'Elasticsearch',
    category: 'Search',
    confidence: 'medium',
    html: [/elasticsearch/i],
    scripts: [/elasticsearch/i],
  },

  // ── Personalisation ───────────────────────────────────────────────────────
  {
    name: 'Dynamic Yield',
    category: 'Personalisation',
    confidence: 'high',
    sfccOpportunity: 'Dynamic Yield is a separate personalisation vendor. Einstein Personalisation is natively embedded in SFCC — eliminating integration cost and providing richer first-party data.',
    html: [/dynamic yield/i, /dynamicyield/i, /cdn\.dynamicyield\.com/i],
    scripts: [/dynamicyield/i],
  },
  {
    name: 'Monetate',
    category: 'Personalisation',
    confidence: 'high',
    sfccOpportunity: 'Monetate is a standalone tool. Einstein A/B Testing and Personalisation in SFCC delivers equivalent capability without the additional vendor.',
    html: [/monetate/i, /se\.monetate\.net/i],
    scripts: [/monetate/i],
  },
  {
    name: 'Nosto',
    category: 'Personalisation',
    confidence: 'high',
    sfccOpportunity: 'Nosto is a third-party recommendations engine. Einstein Product Recommendations is native to SFCC with tighter catalog integration.',
    html: [/nosto/i, /connect\.nosto\.com/i],
    scripts: [/nosto/i],
  },
  {
    name: 'RichRelevance / Emerge',
    category: 'Personalisation',
    confidence: 'medium',
    sfccOpportunity: 'RichRelevance adds integration complexity. Einstein Recommendations achieves equivalent uplift natively within SFCC.',
    html: [/richrelevance/i],
    scripts: [/richrelevance/i],
  },

  // ── Marketing Automation ─────────────────────────────────────────────────
  {
    name: 'Klaviyo',
    category: 'Marketing Automation',
    confidence: 'high',
    sfccOpportunity: 'Klaviyo is popular for SMB email but lacks enterprise depth. Salesforce Marketing Cloud offers AI-driven journey orchestration, mobile push, SMS, and a unified Customer 360.',
    html: [/klaviyo/i, /a\.klaviyo\.com/i],
    scripts: [/klaviyo/i],
  },
  {
    name: 'Salesforce Marketing Cloud',
    category: 'Marketing Automation',
    confidence: 'high',
    html: [/exacttarget/i, /salesforce-marketing-cloud/i, /mc\.exacttarget\.com/i],
    scripts: [/exacttarget/i, /salesforceinteractions/i],
  },
  {
    name: 'Mailchimp',
    category: 'Marketing Automation',
    confidence: 'high',
    sfccOpportunity: 'Mailchimp is SMB email. Salesforce Marketing Cloud provides enterprise journey orchestration, predictive AI, and native Commerce Cloud integration.',
    html: [/mailchimp/i, /chimpstatic\.com/i, /list-manage\.com/i],
    scripts: [/mailchimp/i],
  },
  {
    name: 'HubSpot',
    category: 'Marketing Automation',
    confidence: 'high',
    sfccOpportunity: 'HubSpot Marketing is SMB-focused. Salesforce Marketing Cloud + Commerce Cloud provides a unified enterprise platform with richer segmentation and AI.',
    html: [/hubspot/i, /js\.hs-scripts\.com/i, /js\.hsforms\.net/i],
    scripts: [/hubspot/i, /hs-scripts/i],
  },
  {
    name: 'Dotdigital',
    category: 'Marketing Automation',
    confidence: 'medium',
    sfccOpportunity: 'Dotdigital is a mid-market tool. Salesforce Marketing Cloud offers deeper personalisation, predictive sending, and a direct Commerce Cloud integration.',
    html: [/dotdigital/i, /dmtracking/i],
  },

  // ── Analytics ────────────────────────────────────────────────────────────
  {
    name: 'Google Analytics 4',
    category: 'Analytics',
    confidence: 'high',
    html: [/gtag\(/i, /google-analytics\.com\/g\//i, /googletagmanager/i],
    scripts: [/googletagmanager/i, /google-analytics/i],
  },
  {
    name: 'Google Analytics (UA)',
    category: 'Analytics',
    confidence: 'high',
    html: [/google-analytics\.com\/analytics\.js/i, /ua-\d{5,}/i],
    scripts: [/analytics\.js/i],
  },
  {
    name: 'Adobe Analytics',
    category: 'Analytics',
    confidence: 'high',
    html: [/omniture/i, /s_code\.js/i, /2o7\.net/i, /adobedtm\.com/i],
    scripts: [/omniture/i, /2o7\.net/i, /adobedtm/i],
  },
  {
    name: 'Heap',
    category: 'Analytics',
    confidence: 'high',
    html: [/heap\.io/i, /heapanalytics/i],
    scripts: [/heapanalytics/i],
  },
  {
    name: 'Hotjar',
    category: 'Analytics',
    confidence: 'high',
    html: [/hotjar/i, /static\.hotjar\.com/i],
    scripts: [/hotjar/i],
  },
  {
    name: 'Mixpanel',
    category: 'Analytics',
    confidence: 'high',
    html: [/mixpanel/i],
    scripts: [/mixpanel/i],
  },

  // ── Tag Management ───────────────────────────────────────────────────────
  {
    name: 'Google Tag Manager',
    category: 'Tag Management',
    confidence: 'high',
    html: [/googletagmanager\.com\/gtm\.js/i, /gtm\.js\?id=GTM-/i],
    scripts: [/googletagmanager/i],
  },
  {
    name: 'Tealium',
    category: 'Tag Management',
    confidence: 'high',
    html: [/tealium/i, /tags\.tiqcdn\.com/i],
    scripts: [/tealium/i, /tiqcdn/i],
  },
  {
    name: 'Adobe Launch / DTM',
    category: 'Tag Management',
    confidence: 'high',
    html: [/adobedtm\.com/i, /assets\.adobedtm\.com/i],
    scripts: [/adobedtm/i],
  },

  // ── CDN ──────────────────────────────────────────────────────────────────
  {
    name: 'Cloudflare',
    category: 'CDN',
    confidence: 'high',
    headers: [{ name: 'cf-ray' }, { name: 'cf-cache-status' }],
  },
  {
    name: 'Fastly',
    category: 'CDN',
    confidence: 'high',
    headers: [{ name: 'x-fastly-request-id' }, { name: 'x-served-by', pattern: /cache/i }],
  },
  {
    name: 'Akamai',
    category: 'CDN',
    confidence: 'high',
    headers: [{ name: 'x-akamai-transformed' }, { name: 'x-check-cacheable' }],
    html: [/akamai/i],
  },
  {
    name: 'AWS CloudFront',
    category: 'CDN',
    confidence: 'high',
    headers: [{ name: 'x-amz-cf-id' }, { name: 'x-amz-cf-pop' }],
  },
  {
    name: 'jsDelivr',
    category: 'CDN',
    confidence: 'medium',
    scripts: [/cdn\.jsdelivr\.net/i],
  },

  // ── Reviews & Ratings ────────────────────────────────────────────────────
  {
    name: 'Bazaarvoice',
    category: 'Reviews & Ratings',
    confidence: 'high',
    sfccOpportunity: 'Bazaarvoice is a strong reviews tool. SFCC integrates natively and also supports Salesforce Reviews which unifies social proof with Commerce data.',
    html: [/bazaarvoice/i, /bv_css_namespace/i],
    scripts: [/bazaarvoice/i],
  },
  {
    name: 'Yotpo',
    category: 'Reviews & Ratings',
    confidence: 'high',
    sfccOpportunity: 'Yotpo is a separate integration. SFCC natively surfaces ratings and integrates with leading review platforms through the LINK marketplace.',
    html: [/yotpo/i, /staticw2\.yotpo\.com/i],
    scripts: [/yotpo/i],
  },
  {
    name: 'Trustpilot',
    category: 'Reviews & Ratings',
    confidence: 'high',
    html: [/trustpilot/i, /widget\.trustpilot\.com/i],
    scripts: [/trustpilot/i],
  },
  {
    name: 'Power Reviews',
    category: 'Reviews & Ratings',
    confidence: 'high',
    html: [/powerreviews/i, /readservices-b2c\.powerreviews/i],
    scripts: [/powerreviews/i],
  },

  // ── Live Chat & Support ──────────────────────────────────────────────────
  {
    name: 'Salesforce Service Cloud / Live Agent',
    category: 'Live Chat & Support',
    confidence: 'high',
    html: [/live\.salesforce\.com/i, /service\.force\.com/i, /liveagent/i],
    scripts: [/salesforce.*chat/i, /live\.salesforce/i],
  },
  {
    name: 'Zendesk',
    category: 'Live Chat & Support',
    confidence: 'high',
    sfccOpportunity: 'Zendesk is a standalone service tool. Salesforce Service Cloud provides native integration with Commerce Cloud — enabling order-in-context service and AI-powered case deflection.',
    html: [/zendesk/i, /zopim/i, /static\.zdassets\.com/i],
    scripts: [/zendesk/i, /zopim/i],
  },
  {
    name: 'Intercom',
    category: 'Live Chat & Support',
    confidence: 'high',
    sfccOpportunity: 'Intercom is a product-focused chat tool. Salesforce Service Cloud + Agentforce provides AI-powered service natively integrated with order and commerce data.',
    html: [/intercom/i, /widget\.intercom\.io/i, /js\.intercomcdn\.com/i],
    scripts: [/intercom/i],
  },
  {
    name: 'Drift',
    category: 'Live Chat & Support',
    confidence: 'high',
    sfccOpportunity: 'Drift is a B2B conversational tool. Agentforce Shopping Agents provides AI-native conversational commerce natively within SFCC.',
    html: [/drift/i, /js\.drift\.com/i],
    scripts: [/drift/i],
  },
  {
    name: 'LiveChat',
    category: 'Live Chat & Support',
    confidence: 'high',
    sfccOpportunity: 'LiveChat adds a third-party dependency. Salesforce Service Cloud + Agentforce delivers AI-augmented chat natively integrated with Commerce order data.',
    html: [/livechat/i, /cdn\.livechatinc\.com/i],
    scripts: [/livechatinc/i],
  },

  // ── Loyalty ──────────────────────────────────────────────────────────────
  {
    name: 'Loyalty Lion',
    category: 'Loyalty',
    confidence: 'high',
    sfccOpportunity: 'LoyaltyLion is a standalone loyalty add-on. Salesforce Loyalty Management integrates natively with Commerce Cloud — surfacing points and rewards across all touchpoints.',
    html: [/loyaltylion/i, /loyalty\.lion/i],
    scripts: [/loyaltylion/i],
  },
  {
    name: 'Yotpo Loyalty',
    category: 'Loyalty',
    confidence: 'medium',
    sfccOpportunity: 'Yotpo Loyalty is a separate vendor. Salesforce Loyalty Management provides an enterprise-grade, native alternative with full CRM integration.',
    html: [/yotpo.*loyalty/i, /swell\.yotpo/i],
    scripts: [/swell\.yotpo/i],
  },
  {
    name: 'Salesforce Loyalty Management',
    category: 'Loyalty',
    confidence: 'medium',
    html: [/salesforce.*loyalty/i],
  },

  // ── Order Management ─────────────────────────────────────────────────────
  {
    name: 'Salesforce Order Management',
    category: 'Order Management',
    confidence: 'medium',
    html: [/salesforce.*order management/i, /sfom/i],
  },
  {
    name: 'Manhattan Associates',
    category: 'Order Management',
    confidence: 'medium',
    sfccOpportunity: 'Manhattan OMS is an on-premise legacy system. Salesforce Order Management is a cloud-native, natively integrated OMS with real-time inventory and distributed order orchestration.',
    html: [/manhattan associates/i, /manh\.com/i],
  },
  {
    name: 'IBM Sterling',
    category: 'Order Management',
    confidence: 'medium',
    sfccOpportunity: 'IBM Sterling is a complex on-premise OMS. Salesforce Order Management provides cloud-native fulfilment with native Commerce Cloud integration and lower TCO.',
    html: [/sterling.*commerce/i, /ibm.*sterling/i],
  },

  // ── Payment ──────────────────────────────────────────────────────────────
  {
    name: 'Stripe',
    category: 'Payment',
    confidence: 'high',
    html: [/js\.stripe\.com/i, /stripe\.com\/v3/i],
    scripts: [/stripe/i],
  },
  {
    name: 'PayPal',
    category: 'Payment',
    confidence: 'high',
    html: [/paypal/i, /paypalobjects\.com/i],
    scripts: [/paypal/i],
  },
  {
    name: 'Adyen',
    category: 'Payment',
    confidence: 'high',
    html: [/adyen/i, /checkoutshopper.*adyen/i],
    scripts: [/adyen/i],
  },
  {
    name: 'Klarna',
    category: 'Payment',
    confidence: 'high',
    html: [/klarna/i, /x\.klarnacdn\.net/i],
    scripts: [/klarna/i],
  },
  {
    name: 'Afterpay / Clearpay',
    category: 'Payment',
    confidence: 'high',
    html: [/afterpay/i, /clearpay/i],
    scripts: [/afterpay/i, /clearpay/i],
  },
  {
    name: 'Braintree',
    category: 'Payment',
    confidence: 'high',
    html: [/braintree/i, /braintreepayments/i],
    scripts: [/braintree/i],
  },

  // ── A/B Testing ──────────────────────────────────────────────────────────
  {
    name: 'Optimizely',
    category: 'A/B Testing',
    confidence: 'high',
    sfccOpportunity: 'Optimizely is a standalone testing tool. SFCC includes A/B testing for promotions and page content natively, and Einstein automatically optimises based on results.',
    html: [/optimizely/i, /cdn\.optimizely\.com/i],
    scripts: [/optimizely/i],
  },
  {
    name: 'VWO',
    category: 'A/B Testing',
    confidence: 'high',
    sfccOpportunity: 'VWO is a third-party testing tool. SFCC includes native experimentation with Einstein AI optimisation — reducing the need for external A/B testing vendors.',
    html: [/vwo\.com/i, /visualwebsiteoptimizer/i],
    scripts: [/vwo/i],
  },
  {
    name: 'Kameleoon',
    category: 'A/B Testing',
    confidence: 'medium',
    html: [/kameleoon/i],
    scripts: [/kameleoon/i],
  },

  // ── Hosting / Infrastructure ─────────────────────────────────────────────
  {
    name: 'AWS',
    category: 'Hosting',
    confidence: 'medium',
    headers: [{ name: 'x-amz-request-id' }, { name: 'x-amzn-requestid' }],
    html: [/amazonaws\.com/i],
  },
  {
    name: 'Google Cloud',
    category: 'Hosting',
    confidence: 'medium',
    headers: [{ name: 'x-goog-request-id' }, { name: 'server', pattern: /gws/i }],
  },
  {
    name: 'Azure',
    category: 'Hosting',
    confidence: 'medium',
    headers: [{ name: 'x-ms-request-id' }, { name: 'x-azure-ref' }],
  },
  {
    name: 'Vercel',
    category: 'Hosting',
    confidence: 'high',
    headers: [{ name: 'x-vercel-id' }, { name: 'x-vercel-cache' }],
  },
  {
    name: 'Netlify',
    category: 'Hosting',
    confidence: 'high',
    headers: [{ name: 'x-nf-request-id' }],
  },

  // ── JavaScript Frameworks ────────────────────────────────────────────────
  {
    name: 'React',
    category: 'JavaScript Framework',
    confidence: 'high',
    html: [/__reactFiber/i, /data-reactroot/i, /react-dom/i],
    scripts: [/react\.production\.min\.js/i, /react-dom/i],
  },
  {
    name: 'Next.js',
    category: 'JavaScript Framework',
    confidence: 'high',
    html: [/__NEXT_DATA__/i, /_next\/static/i],
    scripts: [/_next\//i],
  },
  {
    name: 'Vue.js',
    category: 'JavaScript Framework',
    confidence: 'high',
    html: [/data-v-[a-f0-9]+/i, /vue\.runtime/i],
    scripts: [/vue\.min\.js/i, /vue\.runtime/i],
  },
  {
    name: 'Angular',
    category: 'JavaScript Framework',
    confidence: 'high',
    html: [/ng-version/i, /angular/i],
    scripts: [/angular/i],
  },
  {
    name: 'Nuxt.js',
    category: 'JavaScript Framework',
    confidence: 'high',
    html: [/__NUXT__/i, /_nuxt\//i],
    scripts: [/_nuxt\//i],
  },
]

// ─── Category ordering for display ───────────────────────────────────────────
const CATEGORY_ORDER = [
  'Ecommerce Platform',
  'Search',
  'Personalisation',
  'Marketing Automation',
  'Live Chat & Support',
  'Reviews & Ratings',
  'Loyalty',
  'Order Management',
  'Payment',
  'A/B Testing',
  'Analytics',
  'Tag Management',
  'CDN',
  'Hosting',
  'CMS',
  'JavaScript Framework',
]

export async function checkTechStack(siteUrl: string): Promise<TechStackResult> {
  const normalised = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`

  let html = ''
  const responseHeaders: Record<string, string> = {}
  let scriptSrcs: string[] = []

  try {
    const res = await fetch(normalised, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
      redirect: 'follow',
    })

    html = await res.text()

    // Collect response headers
    res.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value.toLowerCase()
    })

    // Extract all script src values
    const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
    scriptSrcs = Array.from(scriptMatches).map(m => m[1].toLowerCase())
  } catch {
    return { technologies: [], categories: {} }
  }

  const htmlLower = html.toLowerCase()
  const detected: TechItem[] = []
  const seen = new Set<string>()

  for (const rule of RULES) {
    let matched = false

    if (rule.html) {
      for (const pattern of rule.html) {
        if (pattern.test(htmlLower)) { matched = true; break }
      }
    }

    if (!matched && rule.scripts) {
      for (const pattern of rule.scripts) {
        if (scriptSrcs.some(s => pattern.test(s))) { matched = true; break }
      }
    }

    if (!matched && rule.headers) {
      for (const h of rule.headers) {
        const val = responseHeaders[h.name.toLowerCase()]
        if (val !== undefined) {
          if (!h.pattern || h.pattern.test(val)) { matched = true; break }
        }
      }
    }

    if (matched && !seen.has(rule.name)) {
      seen.add(rule.name)
      detected.push({
        name: rule.name,
        category: rule.category,
        confidence: rule.confidence,
        sfccOpportunity: rule.sfccOpportunity,
      })
    }
  }

  // Group by category, respecting display order
  const grouped: Record<string, TechItem[]> = {}
  for (const cat of CATEGORY_ORDER) {
    const items = detected.filter(t => t.category === cat)
    if (items.length) grouped[cat] = items
  }
  // Any uncategorised ones
  for (const tech of detected) {
    if (!grouped[tech.category]) grouped[tech.category] = []
    if (!grouped[tech.category].includes(tech)) grouped[tech.category].push(tech)
  }

  return { technologies: detected, categories: grouped }
}
