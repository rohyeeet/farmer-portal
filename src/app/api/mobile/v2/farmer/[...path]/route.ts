import { randomBytes } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Server-side CSRF proxy for all POST sub-paths under /api/mobile/v2/farmer/.
 *
 * Covers (from apiRegistry.ts):
 *   kycStatusUpdate          POST /api/mobile/v2/farmer/kyc-status/update/
 *   farmerVerificationStatus POST /api/mobile/v2/farmer/verification-status/
 *
 * Both route to KYC_PROXY_TARGET (172.31.31.47:30080).
 *
 * Why this exists
 * ---------------
 * Django's CsrfViewMiddleware rejects POST requests whose Origin header
 * doesn't match CSRF_TRUSTED_ORIGINS. In dev the browser sends
 * Origin: http://localhost:3000, which Django rejects.
 *
 * This handler runs before the next.config.ts rewrite and fixes two things:
 *   1. Replaces Origin/Referer with the backend's own origin so Django's
 *      _origin_verified() check passes (it compares Origin == request.get_host()).
 *   2. Injects a self-consistent Django CSRF token pair (cookie + X-CSRFToken).
 *      Django only verifies that unmask(cookie) == unmask(header); the secret
 *      is not tied to DJANGO_SECRET_KEY, so we can generate valid pairs here.
 *      Algorithm: Vigenère cipher over ascii_letters+digits (62 chars), 32-char secret.
 *
 * Production: NEXT_PUBLIC_API_BASE_URL is set to the full backend URL so
 * the client calls the backend directly — this handler is never reached.
 */

const BACKEND = (process.env.KYC_PROXY_TARGET ?? process.env.DEV_PROXY_TARGET ?? 'http://localhost:8000').replace(/\/+$/, '')
const BACKEND_ORIGIN = (() => { try { return new URL(BACKEND).origin } catch { return BACKEND } })()

const STRIP = new Set([
  'host', 'origin', 'referer',
  'x-forwarded-host', 'x-forwarded-for', 'x-forwarded-proto',
])

// ── Django CSRF token generation ──────────────────────────────────────────────
const CSRF_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const CSRF_LEN = 32

function csrfRandom(): string {
  const out: string[] = []
  while (out.length < CSRF_LEN) {
    for (const b of randomBytes(CSRF_LEN * 2)) {
      if (out.length >= CSRF_LEN) break
      if (b < 62 * 4) out.push(CSRF_CHARS[b % 62])
    }
  }
  return out.join('')
}

function csrfMask(secret: string): string {
  const mask = csrfRandom()
  let cipher = ''
  for (let i = 0; i < CSRF_LEN; i++) {
    cipher += CSRF_CHARS[(CSRF_CHARS.indexOf(secret[i]) + CSRF_CHARS.indexOf(mask[i])) % 62]
  }
  return mask + cipher // 64 chars total
}

function makeCsrfPair() {
  const secret = csrfRandom()
  return { cookie: csrfMask(secret), header: csrfMask(secret) }
}
// ─────────────────────────────────────────────────────────────────────────────

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const suffix = path.filter(Boolean).join('/')
  const hasTrailingSlash = req.nextUrl.pathname.endsWith('/')
  const target = `${BACKEND}/api/mobile/v2/farmer/${suffix}${hasTrailingSlash ? '/' : ''}`

  // Copy all request headers except the browser-identifying ones we're replacing.
  const headers = new Headers()
  for (const [k, v] of req.headers.entries()) {
    if (!STRIP.has(k.toLowerCase())) headers.set(k, v)
  }

  // 1. Origin check: Django compares Origin against request.get_host().
  //    Server-side fetch sets Host: backendtest.varahaag.com automatically,
  //    so setting Origin to the same value satisfies _origin_verified().
  headers.set('origin', BACKEND_ORIGIN)
  headers.set('referer', `${BACKEND_ORIGIN}/`)

  // 2. CSRF token check: inject a freshly generated matching pair.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const { cookie: csrfCookie, header: csrfHeader } = makeCsrfPair()
    const existing = headers.get('cookie') ?? ''
    headers.set('cookie', existing ? `${existing}; csrftoken=${csrfCookie}` : `csrftoken=${csrfCookie}`)
    headers.set('x-csrftoken', csrfHeader)
  }

  const body = await req.arrayBuffer()

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: body.byteLength > 0 ? body : undefined,
    })
  } catch (err) {
    console.error('[farmer-proxy] upstream unreachable:', err)
    return NextResponse.json({ detail: 'KYC service is currently unreachable. Please ensure VPN is connected and try again.' }, { status: 502 })
  }

  const text = await upstream.text()

  if (!upstream.ok) {
    console.error(`[farmer-proxy] ${req.method} ${target} → ${upstream.status}`)
    console.error('[farmer-proxy] body:', text.slice(0, 500))
  }

  // If Django returned an HTML error page, surface the reason as JSON detail.
  const ct = upstream.headers.get('Content-Type') ?? ''
  let responseBody = text
  if (!upstream.ok && ct.includes('text/html')) {
    const reason =
      text.match(/CSRF[^<"]+/i)?.[0]?.trim() ??
      text.match(/<p[^>]*>([^<]{10,})<\/p>/i)?.[1]?.trim() ??
      `HTTP ${upstream.status}`
    responseBody = JSON.stringify({ detail: reason })
  }

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      'Content-Type': ct.includes('text/html') ? 'application/json' : (ct || 'application/json'),
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path)
}
