@AGENTS.md

# CC Site Audit — Project Reference

## What this is

An internal Salesforce tool for AEs, SEs and CSMs to audit any retail/ecommerce site and surface Salesforce Commerce Cloud opportunities. It scores a site across 12 capability categories, detects the tech stack, and generates an AI Readiness analysis — all in minutes.

**Live URL:** https://cc-site-audit-98495c4bd727.herokuapp.com/
**GitHub:** https://github.com/sachinpatelsalesforce/cc-site-audit

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 (inline style overrides for brand colours) |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Crawler | Puppeteer (headless Chrome, server-side in API routes) |
| Performance | Google PageSpeed Insights API v5 (mobile strategy) |
| AI Readiness | Google Gemini 2.0 Flash via REST (`GEMINI_API_KEY`) |
| Hosting | Heroku (Eco dyno + Essential Postgres) |
| Repo | GitHub — `sachinpatelsalesforce/cc-site-audit` |

---

## Colour palette

| Variable | Hex | Used for |
|---|---|---|
| Sidebar / dark panels | `#2D4A44` | Sidebar bg, header bg, active category strip |
| Gold accent | `#C9A227` | Score card, logo box, active indicators |
| Page background | `#DCE9E8` | Main content area bg, nav pill bg |

All colours are applied via inline `style={{ backgroundColor: '...' }}` — Tailwind arbitrary values like `text-[#2D4A44]` are used for text.

---

## Environment variables

| Variable | Required | Where to get it |
|---|---|---|
| `DATABASE_URL` | Yes | Set automatically by Heroku Postgres addon |
| `GEMINI_API_KEY` | Yes | aistudio.google.com/apikey (personal Google account) |
| `PSI_API_KEY` | Recommended | console.cloud.google.com → PageSpeed Insights API |

Without `GEMINI_API_KEY` the AI Readiness category shows a graceful fallback message instead of scores. Without `PSI_API_KEY` you get 25 PSI requests/day (free tier).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                        # Homepage — intake form + feature panel
│   ├── audit/[id]/page.tsx             # Audit page — polls status, renders correct view
│   ├── audit/[id]/results/page.tsx     # Redirect → /audit/[id]
│   ├── share/[token]/page.tsx          # Public read-only share view
│   └── api/
│       ├── audit/route.ts              # POST — create audit, kick off crawl or manual mode
│       ├── audit/[id]/route.ts         # GET — poll status; PATCH — save category edits
│       ├── audit/[id]/finish/route.ts  # POST — flip manual audit to 'complete'
│       ├── audit/[id]/pdf/route.ts     # GET — Puppeteer PDF export
│       └── proxy/route.ts             # GET — iframe proxy (strips X-Frame-Options)
├── components/
│   ├── IntakeForm.tsx                  # Homepage form (mode toggle, fields, validation)
│   ├── AuditProgress.tsx               # Animated progress screen while crawl runs
│   ├── AuditDashboard.tsx              # Main results dashboard (automated + complete audits)
│   ├── ManualAudit.tsx                 # Split-pane manual audit UI
│   ├── TechReport.tsx                  # Tech stack detection results grid
│   ├── CheckHintTooltip.tsx            # ? hover tooltip — what/how for each check
│   ├── OverallScore.tsx                # Radial score gauge component
│   └── CategoryCard.tsx               # Per-category card (used in some views)
├── lib/
│   ├── auditor.ts                      # Orchestrates all checks → AuditResult
│   ├── crawler.ts                      # Puppeteer crawler — finds homepage/PLP/PDP/cart/checkout URLs
│   ├── scoring.ts                      # Score calculation + top opportunities
│   ├── db.ts                           # Prisma client singleton
│   ├── manual-template.ts              # Blank category template for manual audits
│   ├── check-hints.ts                  # Plain-English what/how for every check ID
│   └── checks/
│       ├── homepage.ts                 # Hero, recommendations, search, nav, trust, live chat
│       ├── search.ts                   # Autocomplete, facets, no-results, breadcrumbs, mega-menu
│       ├── plp.ts                      # Filters, quick-view, hover images, pagination, badges, wishlist
│       ├── pdp.ts                      # Images, video, variants, stock, reviews, recs, sharing, delivery
│       ├── cart.ts                     # Persistent cart, guest checkout, payments, coupon, summary
│       ├── mobile.ts                   # Responsive, nav, touch targets, checkout, PWA
│       ├── performance.ts              # FCP, LCP, CLS, INP, TBT, render-blocking, images
│       ├── vitals.ts                   # PageSpeed Insights API integration (handles quota errors)
│       ├── seo.ts                      # Title, H1, meta, OG tags, structured data, canonical
│       ├── loyalty.ts                  # Loyalty program, wishlist, email capture, account, social proof
│       ├── personalization.ts          # Recs engine, recently viewed, dynamic banners, abandoned cart
│       ├── ai-readiness.ts             # Gemini 2.0 Flash — 6-dimension AI readiness analysis
│       └── tech-stack.ts               # 80+ fingerprint rules across 16 technology categories
└── types/
    └── audit.ts                        # All shared TypeScript interfaces
```

---

## Audit modes

### Automated
1. User submits form with `mode: 'automated'`
2. API creates a DB record (status: `pending`) and immediately returns `{id}`
3. Browser redirects to `/audit/[id]` which shows `AuditProgress` (polls every 2s)
4. Background: Puppeteer crawls homepage → finds PLP/PDP/cart/checkout URLs → runs all 12 check modules in parallel
5. `checkVitals` calls Google PageSpeed Insights API
6. `checkAIReadiness` calls Gemini 2.0 Flash with extracted page text
7. `checkTechStack` fingerprints HTML, script src attributes, and HTTP response headers
8. Results saved to DB (status: `complete`) → browser renders `AuditDashboard`

### Manual
1. User submits form with `mode: 'manual'`
2. API creates a DB record immediately (status: `manual`) with blank template scores
3. Browser renders `ManualAudit` — split-pane: iframe preview | category nav | checklist
4. Background: `runManualAudit()` fires async — runs vitals + AI readiness + tech stack, merges real data into the blank template
5. User clicks through the live site in the iframe and toggles each check Pass/Partial/Gap
6. Auto-saves to DB with 1.5s debounce
7. "Finish Audit" button → calls `/api/audit/[id]/finish` → redirects to full dashboard

---

## Iframe proxy

For sites that block embedding (X-Frame-Options), the manual audit falls back through 3 tiers:
1. **Direct** — load site in iframe
2. **Proxy** — `/api/proxy?url=...` — fetches server-side, strips `X-Frame-Options` + `Content-Security-Policy`, rewrites relative URLs, neutralises `top.location`/`window.parent` frame-busting JS
3. **Blocked** — shows a message with an "Open in new tab" link

---

## Dashboard (AuditDashboard)

Four tabs in the left sidebar nav (white pill style — active tab bleeds to right edge):

- **Overview** — stat cards (overall score, passed, gaps, Lighthouse), radial gauge, top SFCC opportunities, category score mini-grid. Shows an amber "heads up" banner for automated audits. "Edit Scores" button in header navigates to Categories tab.
- **All Categories** — horizontal strip nav + full-page single category view with prev/next. All checks are editable (Pass/Partial/Gap toggles + notes). Auto-saves with 1.5s debounce.
- **Tech Stack** — `TechReport` grid showing detected technologies grouped by category (Ecommerce Platform, Search, Personalisation, Analytics, CDN, etc.) with confidence indicators and SFCC opportunity callouts.
- **Pages Crawled** — shows the URLs Puppeteer found during the crawl.

---

## Tech stack fingerprinter

`src/lib/checks/tech-stack.ts` — ~80 detection rules across 16 categories:

- Ecommerce Platform, Search, Personalisation, Marketing Automation, Live Chat, Reviews, Loyalty, OMS, Payment, A/B Testing, Analytics, Tag Management, CDN, Hosting, CMS, JS Framework

Detection methods: HTML regex patterns, `<script src>` attributes, HTTP response headers. Each rule can carry an `sfccOpportunity` string shown in `TechReport` as a SFCC replacement suggestion.

---

## Check hints system

`src/lib/check-hints.ts` — plain-English tooltip for every check ID. Each hint has:
- `what` — what the feature is in non-technical language
- `how` — step-by-step instructions for how to verify it on the live site

Rendered by `CheckHintTooltip.tsx` — a `?` badge next to every check label. Uses `createPortal` + viewport positioning so it never clips off-screen regardless of panel width.

---

## Scoring

- Each check is `pass` (2pts) / `partial` (1pt) / `fail` (0pts)
- Category score = `earned / (checks × 2) × 100`
- Overall score = average of all category scores
- Grades: A ≥90, B ≥80, C ≥70, D ≥60, F <60
- Top opportunities = all `fail` checks with `sfccValue`, ranked by impact

---

## Data model (Prisma / PostgreSQL)

```prisma
model Audit {
  id           String   @id @default(cuid())
  shareToken   String   @unique @default(cuid())
  siteUrl      String
  auditorName  String
  auditorEmail String
  opportunity  String?
  region       String
  status       String   @default("pending")  // pending | running | complete | error | manual
  progress     Int      @default(0)
  currentStep  String   @default("")
  results      Json?    // AuditResult serialised
  errorMessage String?
  createdAt    DateTime @default(now())
}
```

---

## Deployment (Heroku)

```
Procfile:     web: npx prisma migrate deploy && npm start
.buildpacks:  1. jontewks/puppeteer-heroku-buildpack
              2. heroku/nodejs
```

**Deploy steps:**
```bash
heroku create cc-site-audit
heroku addons:create heroku-postgresql:essential-0
heroku buildpacks:add https://github.com/jontewks/puppeteer-heroku-buildpack
heroku buildpacks:add heroku/nodejs
heroku config:set GEMINI_API_KEY=<key>
heroku config:set PSI_API_KEY=<key>
git push heroku main
```

`DATABASE_URL` is injected automatically by the Heroku Postgres addon. Prisma migrations run automatically on each deploy via the Procfile.

---

## Local development

```bash
# Install dependencies
npm install

# Set up local DB
createdb site_audit_dev
# Add to .env: DATABASE_URL="postgresql://localhost:5432/site_audit_dev"

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

The `.env` file is gitignored. Never commit API keys.

---

## Known limitations / future work

- Automated crawl can miss login-gated content, personalised recommendations, and JS-rendered features — the amber banner on the overview tab communicates this
- Puppeteer on Heroku Eco dynos can be slow (~30–60s per audit) — consider upgrading to Basic dyno for production use
- Share links are public (no auth) — suitable for internal demos but add auth before broader rollout
- PDF export uses Puppeteer to screenshot the dashboard — works but layout can vary
- AI Readiness scores are based on homepage text only — deeper multi-page analysis would improve accuracy
