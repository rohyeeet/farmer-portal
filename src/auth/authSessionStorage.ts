/**
 * Tab-scoped session (sessionStorage). Mitigates persistence across shared devices vs localStorage.
 * Tokens remain readable by same-origin scripts — pair with strict CSP + XSS hygiene in production.
 */
import type { ValidateOtpResponseBody } from '../types/auth.api'
import type { PersistedAuthSessionV1 } from './authSession.types'

const STORAGE_KEY = 'fp_auth_session_v1'

function safeParse(raw: string | null): PersistedAuthSessionV1 | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as PersistedAuthSessionV1).version !== 1 ||
      typeof (parsed as PersistedAuthSessionV1).accessToken !== 'string' ||
      typeof (parsed as PersistedAuthSessionV1).tokenType !== 'string'
    ) {
      return null
    }
    const p = parsed as PersistedAuthSessionV1
    if (
      typeof p.clientHeader !== 'object' ||
      p.clientHeader === null ||
      typeof p.clientHeader.name !== 'string' ||
      typeof p.clientHeader.value !== 'string'
    ) {
      return null
    }
    return p
  } catch {
    return null
  }
}

export function readAuthSession(): PersistedAuthSessionV1 | null {
  try {
    return safeParse(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function writeAuthSessionFromValidateResponse(body: ValidateOtpResponseBody): void {
  const accessToken = body.token?.access_token?.trim()
  if (!accessToken) {
    throw new Error('Missing access token in login response')
  }
  const session: PersistedAuthSessionV1 = {
    version: 1,
    accessToken,
    tokenType: body.token.token_type?.trim() || 'Bearer',
    clientHeader: {
      name: body.x_header?.name?.trim() ?? '',
      value: body.x_header?.value?.trim() ?? '',
    },
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Authorization header value for authenticated API calls (Bearer …). */
export function getAuthorizationHeaderValue(session: PersistedAuthSessionV1): string {
  const type = session.tokenType.trim() || 'Bearer'
  return `${type} ${session.accessToken}`.trim()
}

/**
 * Headers for authenticated JSON APIs (Bearer + optional X-Client-ID from login).
 */
export function getAuthHeaderRecord(): Record<string, string> {
  const session = readAuthSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: getAuthorizationHeaderValue(session),
  }
  const { name, value } = session.clientHeader
  if (name && value) {
    headers[name] = value
  }
  return headers
}

