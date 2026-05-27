import { getApiBaseUrl } from '../config/env'
import { getJsonAuth } from './http/getJsonAuth'
import { ApiError } from './http/ApiError'

export type GeoOption = { id: number; name: string }

function joinUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}

function readArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.results)) return o.results
  }
  return []
}

function pickName(o: Record<string, unknown>): string {
  const candidates = [
    o.display_name,
    o.name,
    o.country_name,
    o.state_name,
    o.district_name,
    o.block_name,
    o.tenant_name,
    o.title,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return ''
}

function pickId(o: Record<string, unknown>): number {
  const raw = o.id ?? o.country_id ?? o.state_id ?? o.district_id ?? o.block_id
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : NaN
}

export function normalizeGeoList(body: unknown): GeoOption[] {
  const out: GeoOption[] = []
  for (const item of readArray(body)) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = pickId(o)
    const name = pickName(o)
    if (!Number.isFinite(id) || !name) continue
    out.push({ id, name })
  }
  return out
}

async function getJsonGeo(url: string): Promise<GeoOption[]> {
  try {
    const body = await getJsonAuth<unknown>(url)
    return normalizeGeoList(body)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw e
    return []
  }
}

/** Country list — `GET /core/api/country/all` */
export function fetchCountryOptions(): Promise<GeoOption[]> {
  return getJsonGeo(joinUrl('/core/api/country/all'))
}

/** States — `GET /core/api/state/all?country_id=<id>` */
export function fetchStateOptions(countryId: number): Promise<GeoOption[]> {
  const sp = new URLSearchParams({ country_id: String(countryId) })
  return getJsonGeo(joinUrl(`/core/api/state/all?${sp.toString()}`))
}

/** Districts — `GET /core/api/district/all?state_id=<id>` */
export function fetchDistrictOptions(stateId: number): Promise<GeoOption[]> {
  const sp = new URLSearchParams({ state_id: String(stateId) })
  return getJsonGeo(joinUrl(`/core/api/district/all?${sp.toString()}`))
}

/** Blocks — `GET /core/api/block/all?district_id=<id>` */
export function fetchBlockOptions(districtId: number): Promise<GeoOption[]> {
  const sp = new URLSearchParams({ district_id: String(districtId) })
  return getJsonGeo(joinUrl(`/core/api/block/all?${sp.toString()}`))
}
