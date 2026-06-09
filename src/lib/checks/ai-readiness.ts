import type { CheckResult, CheckStatus } from '@/types/audit'

export interface AIReadinessResult {
  checks: CheckResult[]
  summary: string
  customerQuestions: string[]
  contentGaps: string[]
  recommendations: { priority: 'P1' | 'P2' | 'P3'; text: string }[]
}

interface DimensionScore {
  score: number  // 1-10
  rationale: string
  gaps: string[]
}

interface AIAnalysis {
  overallScore: number  // 1-100
  execSummary: string
  dimensions: {
    productDataQuality: DimensionScore
    aiDiscoverability: DimensionScore
    conversationalCommerce: DimensionScore
    structuredData: DimensionScore
    semanticSEO: DimensionScore
    contentDepth: DimensionScore
  }
  customerQuestions: string[]
  contentGaps: string[]
  recommendations: { priority: 'P1' | 'P2' | 'P3'; text: string }[]
}

function scoreToStatus(score: number): CheckStatus {
  if (score >= 7) return 'pass'
  if (score >= 4) return 'partial'
  return 'fail'
}

async function fetchPageContent(siteUrl: string): Promise<string> {
  const normalised = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  try {
    const res = await fetch(normalised, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteAuditBot/1.0)' },
    })
    const html = await res.text()
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    return stripped.slice(0, 25000)
  } catch {
    return ''
  }
}

function buildFallback(reason: string): AIReadinessResult {
  const dims = [
    { id: 'ai-product-data', label: 'Product Data Quality (25%)' },
    { id: 'ai-discoverability', label: 'AI Discoverability (20%)' },
    { id: 'ai-conversational', label: 'Conversational Commerce (20%)' },
    { id: 'ai-structured-data', label: 'Structured Data (15%)' },
    { id: 'ai-semantic-seo', label: 'Semantic SEO (10%)' },
    { id: 'ai-content-depth', label: 'Content Depth (10%)' },
  ]
  return {
    checks: dims.map(d => ({
      id: d.id,
      label: d.label,
      status: 'partial' as CheckStatus,
      detail: reason,
    })),
    summary: reason,
    customerQuestions: [],
    contentGaps: [],
    recommendations: [],
  }
}

const SYSTEM_PROMPT = `You are an AI Commerce Readiness Auditor. Your job is to evaluate how well a retail/ecommerce site is prepared for AI-driven discovery, recommendations, and conversational commerce across platforms like ChatGPT, Google AI Overviews, Gemini, Perplexity, and AI shopping assistants.

You will be given the extracted text content from a site's homepage. Analyse it across 6 weighted dimensions and return a structured JSON analysis.

Scoring dimensions (each 1-10):
- productDataQuality (weight 25%): Rich product descriptions, specs, attributes, pricing clarity, availability signals
- aiDiscoverability (weight 20%): LLM-readable content structure, headings hierarchy, FAQ content, clear entity definitions
- conversationalCommerce (weight 20%): Chat/assistant integration, question-answering content, natural language product discovery
- structuredData (weight 15%): Schema.org markup (Product, Offer, Review, BreadcrumbList, FAQPage), JSON-LD presence
- semanticSEO (weight 10%): Semantic keyword coverage, topic depth, entity relationships, intent-matching content
- contentDepth (weight 10%): Buying guides, how-to content, comparison articles, FAQs

Return ONLY valid JSON matching this schema exactly:
{
  "overallScore": <1-100 weighted composite>,
  "execSummary": "<2-3 sentence executive summary>",
  "dimensions": {
    "productDataQuality": { "score": <1-10>, "rationale": "<1 sentence>", "gaps": ["<gap 1>", "<gap 2>"] },
    "aiDiscoverability": { "score": <1-10>, "rationale": "<1 sentence>", "gaps": ["<gap 1>", "<gap 2>"] },
    "conversationalCommerce": { "score": <1-10>, "rationale": "<1 sentence>", "gaps": ["<gap 1>", "<gap 2>"] },
    "structuredData": { "score": <1-10>, "rationale": "<1 sentence>", "gaps": ["<gap 1>", "<gap 2>"] },
    "semanticSEO": { "score": <1-10>, "rationale": "<1 sentence>", "gaps": ["<gap 1>", "<gap 2>"] },
    "contentDepth": { "score": <1-10>, "rationale": "<1 sentence>", "gaps": ["<gap 1>", "<gap 2>"] }
  },
  "customerQuestions": ["<10-15 natural language questions a shopper might ask an AI assistant>"],
  "contentGaps": ["<3-5 specific content gaps that prevent AI systems from fully understanding this site>"],
  "recommendations": [
    { "priority": "P1", "text": "<critical fix>" },
    { "priority": "P1", "text": "<critical fix>" },
    { "priority": "P2", "text": "<important improvement>" },
    { "priority": "P2", "text": "<important improvement>" },
    { "priority": "P3", "text": "<nice-to-have enhancement>" }
  ]
}`

export async function checkAIReadiness(siteUrl: string): Promise<AIReadinessResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return buildFallback('GEMINI_API_KEY not configured — AI Readiness analysis skipped.')
  }

  const pageContent = await fetchPageContent(siteUrl)
  if (!pageContent) {
    return buildFallback('Could not fetch page content for AI Readiness analysis.')
  }

  const userMessage = `Site URL: ${siteUrl}

Homepage content (extracted text):
${pageContent}

Analyse this site's AI readiness and return ONLY the JSON analysis with no additional text.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return buildFallback(`Gemini API error: ${res.status} — ${err.slice(0, 200)}`)
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!raw) return buildFallback('Empty response from Gemini.')

    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    let analysis: AIAnalysis
    try {
      analysis = JSON.parse(cleaned) as AIAnalysis
    } catch {
      return buildFallback('Gemini returned unparseable JSON.')
    }

    const { dimensions, overallScore, execSummary, customerQuestions, contentGaps, recommendations } = analysis

    const WEIGHTS: Record<keyof AIAnalysis['dimensions'], number> = {
      productDataQuality: 0.25,
      aiDiscoverability: 0.20,
      conversationalCommerce: 0.20,
      structuredData: 0.15,
      semanticSEO: 0.10,
      contentDepth: 0.10,
    }

    const LABELS: Record<keyof AIAnalysis['dimensions'], string> = {
      productDataQuality: 'Product Data Quality (25%)',
      aiDiscoverability: 'AI Discoverability (20%)',
      conversationalCommerce: 'Conversational Commerce (20%)',
      structuredData: 'Structured Data (15%)',
      semanticSEO: 'Semantic SEO (10%)',
      contentDepth: 'Content Depth (10%)',
    }

    const IDS: Record<keyof AIAnalysis['dimensions'], string> = {
      productDataQuality: 'ai-product-data',
      aiDiscoverability: 'ai-discoverability',
      conversationalCommerce: 'ai-conversational',
      structuredData: 'ai-structured-data',
      semanticSEO: 'ai-semantic-seo',
      contentDepth: 'ai-content-depth',
    }

    const checks: CheckResult[] = (Object.keys(WEIGHTS) as Array<keyof AIAnalysis['dimensions']>).map(key => {
      const dim = dimensions[key]
      const weight = WEIGHTS[key]
      const sfccValue = dim.score < 7
        ? `Salesforce Commerce Cloud with Einstein AI, Agentforce Shopping Agents, and its open data model provides the structured product data, AI-native discovery layers, and conversational commerce tools to address this gap — contributing to the ${Math.round(weight * 100)}% weighted score improvement.`
        : undefined
      return {
        id: IDS[key],
        label: LABELS[key],
        status: scoreToStatus(dim.score),
        detail: `Score: ${dim.score}/10 — ${dim.rationale}${dim.gaps.length ? ` Gaps: ${dim.gaps.join('; ')}` : ''}`,
        sfccValue,
      }
    })

    return {
      checks,
      summary: execSummary || `Overall AI Readiness Score: ${overallScore}/100`,
      customerQuestions: customerQuestions || [],
      contentGaps: contentGaps || [],
      recommendations: recommendations || [],
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return buildFallback(`AI Readiness analysis failed: ${msg}`)
  }
}
