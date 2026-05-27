import { readAuthSession } from '../../auth/authSessionStorage'
import { ensureApiTrailingSlash } from '../../config/apiUrl'
import { ApiError } from './ApiError'

export type PostJsonAuthOptions = {
  signal?: AbortSignal
}

export async function postJsonAuth<T>(
  url: string,
  body: unknown,
  options?: PostJsonAuthOptions,
): Promise<T> {
  const session = readAuthSession()
  if (!session) {
    throw new ApiError(401, null, 'Not authenticated')
  }

  const normalizedUrl = ensureApiTrailingSlash(url)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
  }
  const { name, value } = session.clientHeader
  if (name && value) {
    headers[name] = value
  }

  let payload: BodyInit
  if (body instanceof FormData) {
    payload = body
  } else {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(normalizedUrl, {
    method: 'POST',
    headers,
    body: payload,
    signal: options?.signal,
  })

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.replace('/login/')
    }
    throw new ApiError(401, data, 'Session expired')
  }

  if (!res.ok) {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    const message =
      (typeof o.detail === 'string' && o.detail) ||
      (typeof o.message === 'string' && o.message) ||
      `Request failed (${res.status})`
    throw new ApiError(res.status, data, message)
  }

  return data as T
}
