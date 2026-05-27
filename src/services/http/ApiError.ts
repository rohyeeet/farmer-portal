function messageFromBody(body: unknown): string | null {
  if (body === null || body === undefined) return null
  if (typeof body === 'string' && body.trim()) return body.trim()
  if (typeof body !== 'object') return null

  const o = body as Record<string, unknown>

  if (typeof o.detail === 'string') return o.detail
  if (typeof o.message === 'string') return o.message
  if (typeof o.error === 'string') return o.error

  const errors = o.errors
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown>
    if (typeof first?.detail === 'string') return first.detail
  }

  return null
}

export class ApiError extends Error {
  readonly status: number

  readonly body: unknown

  constructor(status: number, body: unknown, fallbackMessage: string) {
    super(messageFromBody(body) ?? fallbackMessage)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}
