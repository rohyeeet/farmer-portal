export function ensureApiTrailingSlash(url: string): string {
  const [path, suffix = ''] = url.split(/([?#].*)/, 2)
  if (!path) return url

  const isApiPath =
    path === '/api' ||
    path.endsWith('/api') ||
    path.includes('/api/')

  if (!isApiPath || path.endsWith('/') || path.endsWith('/kyc-status/update')) return url

  return `${path}/${suffix}`
}
