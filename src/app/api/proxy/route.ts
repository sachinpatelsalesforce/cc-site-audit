import { NextRequest, NextResponse } from 'next/server'

// Proxy a remote URL, strip frame-blocking headers, and rewrite absolute links
// so navigation attempts stay inside the proxy rather than escaping.
// Usage: GET /api/proxy?url=https://example.com

const BLOCKED_RESPONSE_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-content-type-options', // can interfere with rewritten HTML
])

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url')
  if (!rawUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(rawUrl)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  // Only allow http/https
  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    return new NextResponse('Only http/https urls are allowed', { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
      redirect: 'follow',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new NextResponse(`Failed to fetch upstream: ${msg}`, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? ''

  // For non-HTML resources (images, CSS, JS), stream through as-is
  if (!contentType.includes('text/html')) {
    const headers = new Headers()
    for (const [k, v] of upstream.headers.entries()) {
      if (!BLOCKED_RESPONSE_HEADERS.has(k.toLowerCase())) {
        headers.set(k, v)
      }
    }
    headers.set('Access-Control-Allow-Origin', '*')
    return new NextResponse(upstream.body, { status: upstream.status, headers })
  }

  // HTML — rewrite to keep navigation inside the proxy
  const html = await upstream.text()
  const origin = targetUrl.origin
  const proxyBase = '/api/proxy?url='

  const rewritten = html
    // Inject <base> so relative URLs resolve against the target origin
    .replace(
      /(<head[^>]*>)/i,
      `$1<base href="${origin}/" />`
    )
    // Rewrite absolute href/src/action attributes pointing to the same origin
    // through our proxy, so same-site navigation stays embedded
    .replace(
      /(href|src|action)="(https?:\/\/[^"]+)"/gi,
      (_match, attr, url) => {
        // Only proxy same-origin links to keep external (CDN) assets direct
        if (url.startsWith(origin)) {
          return `${attr}="${proxyBase}${encodeURIComponent(url)}"`
        }
        return `${attr}="${url}"`
      }
    )
    // Neutralise JS frame-busting: top/parent location rewrites
    .replace(/\btop\.location\b/g, 'window.location')
    .replace(/\bparent\.location\b/g, 'window.location')
    .replace(/\bwindow\.top\b/g, 'window.self')
    .replace(/\bwindow\.parent\b/g, 'window.self')

  const headers = new Headers()
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Access-Control-Allow-Origin', '*')
  // Explicitly allow framing from our own origin
  headers.set('X-Frame-Options', 'SAMEORIGIN')

  return new NextResponse(rewritten, { status: upstream.status, headers })
}
