import { randomBytes } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Server-side CSRF proxy for /bre/<anything>.
 *
 * Covers (from apiRegistry.ts):
 *   kycAadhaarOtp          POST /bre/v1/farmer/kyc/aadhaar/otp/
 *   kycAadhaarVerify       POST /bre/v1/farmer/kyc/aadhaar/verify/
 *   kycStatusUpdate        POST /bre/v1/farmer/kyc-status/update/
 *   farmerVerificationStatus POST /bre/v1/farmer/verification-status/
 *   bankVerification       POST /bre/v1/farmer/bav/
 *
 * Same CSRF bypass mechanism as src/app/api/mobile/v2/farmer/[...path]/route.ts.
 * See that file for the full explanation.
 */

const BACKEND = (process.env.KYC_PROXY_TARGET ?? process.env.DEV_PROXY_TARGET ?? 'http://localhost:8000').replace(/\/+$/, '')
const BACKEND_ORIGIN = (() => { try { return new URL(BACKEND).origin } catch { return BACKEND } })()

const STRIP = new Set([
  'host', 'origin', 'referer',
  'x-forwarded-host', 'x-forwarded-for', 'x-forwarded-proto',
])

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
  return mask + cipher
}

function makeCsrfPair() {
  const secret = csrfRandom()
  return { cookie: csrfMask(secret), header: csrfMask(secret) }
}

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const suffix = path.filter(Boolean).join('/')
  const target = `${BACKEND}/bre/${suffix}/`

  const headers = new Headers()
  for (const [k, v] of req.headers.entries()) {
    if (!STRIP.has(k.toLowerCase())) headers.set(k, v)
  }

  headers.set('origin', BACKEND_ORIGIN)
  headers.set('referer', `${BACKEND_ORIGIN}/`)

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
    console.error('[bre-proxy] upstream unreachable:', err)
    return NextResponse.json({ detail: 'BAV service is currently unreachable. Please ensure VPN is connected and try again.' }, { status: 502 })
  }

  const text = await upstream.text()

  if (!upstream.ok) {
    console.error(`[bre-proxy] ${req.method} ${target} → ${upstream.status}`)
    console.error('[bre-proxy] body:', text.slice(0, 500))
  }

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
