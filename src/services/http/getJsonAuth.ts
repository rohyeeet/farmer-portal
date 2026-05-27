import { clearAuthSession, getAuthHeaderRecord } from '../../auth/authSessionStorage'
import { ensureApiTrailingSlash } from '../../config/apiUrl'
import { ApiError } from './ApiError'

/**
 * Authenticated GET. On 401, clears session and sends the browser to login (full navigation
 * so React state matches storage).
 */
export async function getJsonAuth<TResponse>(url: string): Promise<TResponse> {
  const normalizedUrl = ensureApiTrailingSlash(url)
  const headers = getAuthHeaderRecord()

  const response = await fetch(normalizedUrl, {
    method: 'GET',
    headers,
    credentials: 'omit',
    cache: 'no-store',
  })

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      parsed = text
    }
  }

  if (response.status === 401) {
    clearAuthSession()
    window.location.replace('/login/')
    throw new ApiError(401, parsed, 'Session expired. Please sign in again.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, parsed, 'Request failed. Please try again.')
  }

  return parsed as TResponse
}
