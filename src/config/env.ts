/**
 * API host configuration. Only NEXT_PUBLIC_* variables are exposed to the client bundle.
 * Never put secrets in NEXT_PUBLIC_* variables — they are readable in production builds.
 *
 * Development: leave `NEXT_PUBLIC_API_BASE_URL` empty to call `/api/...` on the Next dev
 * server (same origin); `next.config.ts` rewrites `/api` and `/core` to `DEV_PROXY_TARGET`.
 * Set a full URL only if the backend sends CORS headers for http://localhost:3000.
 */
const PRODUCTION_API_BASE = 'https://backend.varahaag.com'
const TEST_API_BASE = 'https://backendtest.varahaag.com'

const ALLOWED_PRODUCTION_API_BASES: readonly string[] = [
  PRODUCTION_API_BASE,
  TEST_API_BASE,
]

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? ''

  if (process.env.NODE_ENV === 'production') {
    if (!raw) {
      throw new Error(
        'NEXT_PUBLIC_API_BASE_URL is required for production builds. See .env.example.',
      )
    }
    const normalized = stripTrailingSlashes(raw)
    if (!normalized.startsWith('https://')) {
      throw new Error('Production API base URL must use HTTPS.')
    }
    if (!ALLOWED_PRODUCTION_API_BASES.includes(normalized)) {
      throw new Error(
        `NEXT_PUBLIC_API_BASE_URL must be one of: ${ALLOWED_PRODUCTION_API_BASES.join(', ')}`,
      )
    }
    return normalized
  }

  // Development: empty base → same-origin `/api/...` (Next rewrites)
  if (!raw) {
    return ''
  }

  if (typeof window !== 'undefined') {
    console.warn(
      '[farmer-portal] NEXT_PUBLIC_API_BASE_URL is set in development. ' +
        'API calls go cross-origin from the dev server and may fail with Django CSRF ' +
        '("Origin checking failed - http://localhost:3000"). Leave it empty in .env.local ' +
        'and use DEV_PROXY_TARGET in next.config.ts instead.',
    )
  }

  return stripTrailingSlashes(raw)
}

export function getGoogleMapApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY?.trim() ?? ''
}

/** Optional Cloud Console Map ID (vector / styled maps). Omit for raster hybrid. */
export function getGoogleMapId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAP_ID?.trim() ?? ''
}
