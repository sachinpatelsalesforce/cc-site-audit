export interface CheckHint {
  what: string   // what this check means
  how: string    // how to verify it on the site
}

const hints: Record<string, CheckHint> = {
  // ── Homepage ──────────────────────────────────────────────────────────
  'hero-banner': {
    what: 'A large, eye-catching image or banner at the top of the homepage promoting a sale, season, or product.',
    how: 'Look at the homepage — is there a full-width banner, carousel, or promotional image near the top? If yes, mark Pass.',
  },
  'homepage-recommendations': {
    what: 'Products suggested specifically for the visitor, e.g. "Recommended for you" or "You might also like" sections.',
    how: 'Scroll the homepage and look for any product carousels labelled with personalisation language. These are usually AI-driven and update per user.',
  },
  'search-bar': {
    what: 'A visible search box so shoppers can find products by typing keywords.',
    how: 'Check if there is a search input field clearly visible in the header or above the fold. It may be a magnifying glass icon that expands on click.',
  },
  'category-nav': {
    what: 'Navigation links to product categories so shoppers can browse without searching.',
    how: 'Look at the top navigation bar. Are there links to categories like "Women", "Shoes", "Sale"? More than 3 links counts as Pass.',
  },
  'trust-signals': {
    what: 'Elements that reassure visitors the site is safe — customer reviews, star ratings, secure payment badges, or SSL padlock.',
    how: 'Scroll the homepage and look for review counts, star ratings, trust badges (e.g. "Norton Secured"), or "Verified Reviews" sections.',
  },
  'live-chat': {
    what: 'A chat widget allowing shoppers to get help instantly without leaving the site.',
    how: 'Look for a chat bubble icon, usually in the bottom-right corner. It may say "Chat with us" or show a face icon.',
  },

  // ── Search ────────────────────────────────────────────────────────────
  'autocomplete': {
    what: 'As the shopper types in the search box, the site suggests matching products or search terms in a dropdown.',
    how: 'Click the search bar and start typing a product name (e.g. "shoe"). Does a dropdown appear with suggestions before you press Enter?',
  },
  'faceted-search': {
    what: 'Filter options on search results pages — e.g. filter by brand, price range, colour, or size.',
    how: 'Run a search and look at the results page. Are there filter panels on the left or top? Can you narrow by price or category?',
  },
  'no-results': {
    what: 'When a search returns nothing, the site shows helpful alternatives rather than just a blank page.',
    how: 'Search for something that likely won\'t exist (e.g. "xyzabc123"). Does the page show suggestions, popular products, or a helpful message?',
  },
  'breadcrumbs': {
    what: 'A trail of links showing where you are in the site (e.g. Home > Women > Shoes > Trainers).',
    how: 'Navigate to a product or category page and look for a small horizontal path of links near the top of the content area.',
  },
  'mega-menu': {
    what: 'A large dropdown navigation panel that appears when hovering over a category, showing subcategories and sometimes featured products.',
    how: 'Hover over a top-level navigation link. Does a large panel drop down with multiple columns or featured images?',
  },

  // ── PLP ───────────────────────────────────────────────────────────────
  'plp-filters': {
    what: 'Controls to sort and filter the product listing — e.g. sort by price, filter by size or colour.',
    how: 'Visit a category page (e.g. "Women > Dresses"). Are there Sort and Filter controls visible? Can you filter by attributes?',
  },
  'quick-view': {
    what: 'A popup or modal that lets shoppers preview product details without leaving the listing page.',
    how: 'Hover over a product card on a category page. Does a "Quick View" button appear? Click it — does a modal open with product info?',
  },
  'hover-image': {
    what: 'When hovering a product thumbnail, the image swaps to a second view (e.g. model wearing the item).',
    how: 'Hover your mouse over product cards on a listing page. Does the image change to a different photo?',
  },
  'pagination': {
    what: 'A way to navigate through multiple pages of products — numbered pages, a "Load More" button, or infinite scroll.',
    how: 'Scroll to the bottom of a product listing. Are there page number links, a "Next" button, or does the page load more products automatically?',
  },
  'product-badges': {
    what: 'Labels on product thumbnails like "New", "Sale", "Best Seller", or "Low Stock".',
    how: 'Browse a category page and look at the product cards — are there any coloured labels or badges overlaid on the images?',
  },
  'wishlist-listing': {
    what: 'The ability to save a product to a wishlist directly from the product listing page.',
    how: 'Look for a heart icon or "Save" button on product cards in a category listing. You may need to hover the product image to see it.',
  },

  // ── PDP ───────────────────────────────────────────────────────────────
  'product-images': {
    what: 'High-quality product photos with zoom capability and multiple angles.',
    how: 'Open a product page. Are there multiple images? Can you hover or click to zoom in? Is image quality high?',
  },
  'product-video': {
    what: 'A video on the product page showing the item in use or from multiple angles.',
    how: 'Look for a video thumbnail in the product image gallery, or a separate video section below the main images.',
  },
  'variant-selector': {
    what: 'Controls to choose product options like size, colour, or material before adding to cart.',
    how: 'On a product page, look for size buttons, colour swatches, or dropdown selectors. Can you select different options?',
  },
  'stock-indicator': {
    what: 'A message showing whether the product is in stock, low stock, or out of stock.',
    how: 'Look near the "Add to Cart" button for text like "In Stock", "Only 3 left", or "Out of Stock".',
  },
  'reviews-ratings': {
    what: 'Customer reviews and star ratings shown on the product page.',
    how: 'Scroll down the product page. Is there a reviews section with star ratings and written customer reviews?',
  },
  'pdp-recommendations': {
    what: '"You may also like" or "Customers also bought" product suggestions on the product page.',
    how: 'Scroll to the bottom of a product page. Are there product carousels with related or similar items?',
  },
  'social-sharing': {
    what: 'Buttons to share the product on social media platforms.',
    how: 'Look for social sharing icons (Facebook, Twitter, Pinterest, etc.) on the product page.',
  },
  'delivery-estimate': {
    what: 'An estimated delivery date or shipping timeframe shown on the product page.',
    how: 'Look near the "Add to Cart" button for text like "Delivery by Friday" or "Ships in 2-3 days".',
  },

  // ── Cart & Checkout ────────────────────────────────────────────────────
  'persistent-cart': {
    what: 'The cart saves its contents even if you close the browser and come back later.',
    how: 'Add an item to the cart, close the browser completely, reopen and return to the site. Is the item still in the cart?',
  },
  'guest-checkout': {
    what: 'Shoppers can complete a purchase without creating an account.',
    how: 'Go to checkout. Is there an option to "Continue as Guest" or "Checkout without an account"?',
  },
  'multi-payment': {
    what: 'Multiple payment methods accepted — credit card, PayPal, buy now pay later, etc.',
    how: 'Reach the payment step of checkout. How many payment options are shown? Look for logos of PayPal, Klarna, Afterpay, etc.',
  },
  'digital-wallets': {
    what: 'One-tap payment options like Apple Pay or Google Pay.',
    how: 'Look for Apple Pay or Google Pay buttons on the cart page or at checkout. These often appear as dark buttons with the provider logo.',
  },
  'coupon-code': {
    what: 'A field to enter a promo or discount code during checkout.',
    how: 'Go to the cart or checkout page. Is there an input field labelled "Promo code", "Coupon", or "Discount code"?',
  },
  'order-summary': {
    what: 'A running summary of items, quantities, and total cost shown throughout checkout.',
    how: 'Walk through the checkout flow. Is the order summary (items + totals) visible at each step, or does it disappear?',
  },
  'address-autocomplete': {
    what: 'The address form suggests and completes the address as you type (using Google or similar).',
    how: 'Start typing an address in the checkout address field. Does a dropdown appear with address suggestions?',
  },
  'progress-indicator': {
    what: 'A step indicator showing where you are in the checkout process (e.g. step 2 of 3).',
    how: 'Look at the top of the checkout page for a stepper or breadcrumb showing steps like "Cart → Shipping → Payment → Review".',
  },

  // ── Personalisation ───────────────────────────────────────────────────
  'recs-engine': {
    what: 'An AI-powered recommendations engine showing products relevant to each individual shopper.',
    how: 'Browse the site and look for product carousels labelled "Recommended for you", "Based on your browsing", or similar personalised language.',
  },
  'recently-viewed': {
    what: 'A section showing products the shopper recently looked at.',
    how: 'Visit several product pages, then return to the homepage or a category page. Look for a "Recently Viewed" carousel.',
  },
  'personalized-content': {
    what: 'Banners, copy, or content that changes based on the visitor\'s location, behaviour, or preferences.',
    how: 'This is harder to verify without an account. Look for any dynamic content that might differ between users, or region-specific promotions.',
  },
  'dynamic-banners': {
    what: 'Promotional banners that can be personalised or changed based on who is visiting.',
    how: 'Look at the homepage banners. Are they generic site-wide promotions, or do they appear targeted (e.g. showing local currency, local promotions)?',
  },
  'abandoned-cart-signals': {
    what: 'Signs that the site can trigger emails or notifications when a shopper leaves items in their cart.',
    how: 'Add an item to the cart and leave without checking out. This is difficult to verify live — look for any mention of cart reminders in account settings, or check if the site has an email marketing integration.',
  },

  // ── Mobile ────────────────────────────────────────────────────────────
  'responsive': {
    what: 'The site layout adjusts to fit smaller screens like phones and tablets properly.',
    how: 'Open the site on your phone or use browser DevTools to simulate a mobile screen (F12 → toggle device toolbar). Does the layout reflow without horizontal scrolling?',
  },
  'mobile-nav': {
    what: 'Navigation designed for touch screens — typically a hamburger menu icon that opens a slide-out drawer.',
    how: 'On a mobile screen, look for a ≡ (hamburger) icon in the header. Tap it — does a menu slide out with navigation links?',
  },
  'touch-targets': {
    what: 'Buttons and links are large enough to tap accurately on a touchscreen without accidentally hitting the wrong one.',
    how: 'Browse on a phone and try tapping buttons and links. Do they feel easy to tap? Look for buttons that are at least 44×44 pixels.',
  },
  'mobile-checkout': {
    what: 'The checkout flow is optimised for small screens — forms are easy to fill, buttons are large, and payment is streamlined.',
    how: 'Walk through checkout on a mobile device. Is the form easy to complete? Are the fields and buttons appropriately sized?',
  },
  'pwa': {
    what: 'A Progressive Web App prompt, allowing the site to be installed on a phone\'s home screen like a native app.',
    how: 'On a mobile browser, look for an "Add to Home Screen" prompt or banner. In Chrome, check if the install option appears in the browser menu.',
  },
  'viewport-meta': {
    what: 'A technical tag that tells mobile browsers how to scale the page correctly.',
    how: 'This is automatically checked — if the page looks correct on mobile without zooming out, this is likely present.',
  },

  // ── Performance / Core Web Vitals ─────────────────────────────────────
  'fcp': {
    what: 'First Contentful Paint — how quickly the first visible content (text or image) appears after the page starts loading.',
    how: 'This is measured automatically via PageSpeed Insights. Under 1.8 seconds is good; over 3 seconds is a problem.',
  },
  'lcp': {
    what: 'Largest Contentful Paint — how long it takes for the main visible element (usually the hero image) to fully load.',
    how: 'Measured automatically. Under 2.5 seconds is good. The hero banner image is usually the LCP element on a homepage.',
  },
  'cls': {
    what: 'Cumulative Layout Shift — whether elements on the page jump around while loading, which is disorienting for users.',
    how: 'Watch the page load and see if any text, images, or buttons shift position. A score under 0.1 is good.',
  },
  'inp': {
    what: 'Interaction to Next Paint — how quickly the page responds after the user clicks a button or interacts with it.',
    how: 'This is measured automatically. Under 200ms is good. Slow INP means the page feels sluggish when interacting.',
  },
  'tbt': {
    what: 'Total Blocking Time — how long the browser\'s main thread is blocked and unable to respond to user input.',
    how: 'Measured automatically. Under 200ms is good. High TBT usually means too much JavaScript running on load.',
  },
  'lh-score': {
    what: 'The overall Lighthouse performance score (0–100) from Google\'s automated testing tool.',
    how: 'Measured automatically. 90+ is excellent, 50–89 is average, below 50 needs improvement.',
  },
  'speed-index': {
    what: 'How quickly the visible content is populated as the page loads — lower is better.',
    how: 'Measured automatically by PageSpeed Insights. Under 3.4 seconds is good.',
  },
  'ttfb': {
    what: 'Time to First Byte — how long the server takes to respond to a request.',
    how: 'Measured automatically. Under 800ms is acceptable; under 200ms is excellent. High TTFB often means slow server or no CDN.',
  },
  'https': {
    what: 'The site uses HTTPS (secure, encrypted connection) rather than plain HTTP.',
    how: 'Check the browser address bar — there should be a padlock icon and the URL should start with "https://".',
  },
  'render-blocking': {
    what: 'The site avoids loading CSS or JavaScript files that delay the page from displaying.',
    how: 'Measured automatically. This is a technical check — if PageSpeed flags it, the site is loading resources that delay rendering.',
  },
  'image-sizing': {
    what: 'Images are served at the appropriate size for the device, not unnecessarily large.',
    how: 'Measured automatically. If PageSpeed flags this, the site is sending desktop-sized images to mobile users, wasting bandwidth.',
  },
  'lazy-images': {
    what: 'Images below the fold only load when the user scrolls down to them, saving bandwidth.',
    how: 'Open DevTools Network tab, reload, and watch when images load. Images far down the page should load lazily as you scroll.',
  },

  // ── SEO ───────────────────────────────────────────────────────────────
  'title-tag': {
    what: 'Each page has a unique, descriptive title shown in the browser tab and in search engine results.',
    how: 'Check the browser tab for a meaningful title. Right-click → View Source and look for the <title> tag near the top.',
  },
  'h1': {
    what: 'Each page has a single, clear main heading (H1 tag) describing the page content.',
    how: 'Right-click → Inspect, then search for <h1>. There should be exactly one H1 per page that clearly describes the content.',
  },
  'meta-description': {
    what: 'A brief description of each page shown in Google search results below the page title.',
    how: 'Right-click → View Source and search for <meta name="description". There should be a relevant description between 120–160 characters.',
  },
  'open-graph': {
    what: 'Tags that control how the page looks when shared on social media (title, image, description).',
    how: 'View Source and search for <meta property="og:". There should be og:title, og:description, and og:image tags.',
  },
  'structured-data': {
    what: 'Machine-readable data embedded in the page that helps Google understand products, reviews, and prices.',
    how: 'View Source and search for "application/ld+json" or use Google\'s Rich Results Test tool on the URL.',
  },
  'canonical': {
    what: 'A tag telling search engines which is the "official" URL for a page, preventing duplicate content issues.',
    how: 'View Source and search for <link rel="canonical". It should point to the preferred URL for that page.',
  },

  // ── Loyalty & Engagement ──────────────────────────────────────────────
  'loyalty-program': {
    what: 'A rewards or points programme that encourages repeat purchases.',
    how: 'Look for a "Rewards", "Points", "Loyalty", or "Member Benefits" link in the header, footer, or account area.',
  },
  'wishlist': {
    what: 'The ability to save products to a wishlist for later.',
    how: 'Open a product page and look for a heart icon, "Save", or "Add to Wishlist" button.',
  },
  'email-capture': {
    what: 'A newsletter signup form or email capture popup to grow the marketing list.',
    how: 'Look for a newsletter signup section in the footer, a popup that appears on the homepage, or an email offer banner.',
  },
  'account-features': {
    what: 'A customer account area with useful features like order history and saved addresses.',
    how: 'Log in (or look at the account area). Are there features for viewing past orders, saving addresses, and managing preferences?',
  },
  'social-proof': {
    what: 'Elements showing real activity — e.g. "42 people viewing this", "Bestseller", or live purchase notifications.',
    how: 'Browse product pages and the homepage. Look for live counters, bestseller badges, or "X people bought this recently" messages.',
  },

  // ── AI Readiness ──────────────────────────────────────────────────────
  'ai-product-data': {
    what: 'Product data (descriptions, attributes, images) is complete and structured enough to power AI features.',
    how: 'Check a product page — are descriptions detailed and specific? Are key attributes like material, dimensions, and compatibility listed?',
  },
  'ai-structured-data': {
    what: 'Schema.org structured data markup that AI systems can read to understand products.',
    how: 'View Source and search for "application/ld+json". Product schema should include name, price, availability, and reviews.',
  },
  'ai-semantic-seo': {
    what: 'Content uses natural, conversational language that matches how people ask questions — important for AI search and voice.',
    how: 'Read product descriptions and FAQs. Do they answer questions naturally? Is there a Q&A section on product pages?',
  },
  'ai-content-depth': {
    what: 'Pages have enough rich, meaningful content for AI models to generate accurate answers about products.',
    how: 'Read a product page — is the description substantial and informative? Or is it just a few generic sentences?',
  },
  'ai-discoverability': {
    what: 'The site is structured and content-rich enough to be surfaced by AI search engines and conversational AI tools.',
    how: 'Check if the site has an XML sitemap, clear navigation, and rich product content. Try asking a chatbot (e.g. ChatGPT) about products from this brand.',
  },
  'ai-conversational': {
    what: 'The site has any chatbot, conversational commerce, or AI assistant features.',
    how: 'Look for a chat window or AI assistant widget. Check if the site has a product finder, style quiz, or recommendation chatbot.',
  },
}

export function getHint(checkId: string): CheckHint | null {
  return hints[checkId] ?? null
}
