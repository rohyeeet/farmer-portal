import { ensureApiTrailingSlash } from '../../config/apiUrl'
import { ApiError } from './ApiError'

type PostJsonOptions = {
  /** Optional extra headers (e.g. auth) — never log these values. */
  headers?: Record<string, string>
}

const REQUEST_TIMEOUT_MS = 15_000

/**
 * JSON POST helper. Does not log bodies or tokens.
 * Uses same-origin credentials policy default; login routes use no cookies.
 */
export async function postJson<TResponse>(
  url: string,
  body: unknown,
  options: PostJsonOptions = {},
): Promise<TResponse> {
  const normalizedUrl = ensureApiTrailingSlash(url)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(normalizedUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, null, 'Request timed out. Please check your connection.')
    }
    throw err
  }
  clearTimeout(timeoutId)

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      parsed = text
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, parsed, 'Request failed. Please try again.')
  }

  return parsed as TResponse
}
