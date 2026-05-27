import type { KyaariModule } from '../types/kyaari.api'
import type { VerificationStatus } from '../types/verification.types'
import { getApiUrl } from '../config/apiRegistry'
import { ApiError } from './http/ApiError'
import { getJsonAuth } from './http/getJsonAuth'
import { normalizeVerificationStatus } from '../utils/farmCardStatusCompute'

/* =========================================================================
 *  Kyaari listing
 * -------------------------------------------------------------------------
 *  Reuses the existing Varaha endpoint
 *      GET /api/mobile/v2/kyari/all/?agfarm_id=<id>
 *  (singular "kyari" — matches the backend's naming convention; the same
 *  spelling already shows up in farm-row fields like `kyari_count`).
 *
 *  We also send `?farm_id=<id>` in the same query string for safety; the
 *  backend is expected to ignore unknown params, and some deployments
 *  filter on `farm_id` instead.
 *
 *  Response shape — array of objects, accepted via either:
 *      [{ id, kyari_name, area_in_acres, tree_count, verification_status }, …]
 *      { data:    [...] }
 *      { results: [...] }
 *
 *  Per-row field aliases the parser accepts (first wins):
 *      id              | kyari_id    | kyaari_id
 *      kyari_name      | kyaari_name | name
 *      area_in_acres   | area_acres  | area
 *      tree_count      | trees       | number_of_trees
 *      verification_status           | status
 *      plantation_year, plantation_type, surveyor_name,
 *      created_datetime, block_name | location  (all optional)
 *
 *  If the endpoint returns 404 / 501 we degrade gracefully to an empty
 *  list so the UI shows "No kyaaris mapped yet." rather than an error.
 * ========================================================================= */

function toRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

function toStringOrNull(v: unknown): string | null {
  if (typeof v === 'string') {
    const t = v.trim()
    return t ? t : null
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return null
}

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function normalizeStatus(raw: unknown): VerificationStatus {
  return normalizeVerificationStatus(toStringOrNull(raw))
}

/**
 * Walks the most common response envelopes and returns the array
 * payload. Returns [] if nothing array-like is found.
 */
function extractKyaariList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const o = toRecord(data)
  if (!o) return []
  if (Array.isArray(o.data)) return o.data as unknown[]
  if (Array.isArray(o.results)) return o.results as unknown[]
  if (Array.isArray(o.kyaris)) return o.kyaris as unknown[]
  if (Array.isArray(o.kyaaris)) return o.kyaaris as unknown[]
  if (Array.isArray(o.kyari)) return o.kyari as unknown[]
  if (Array.isArray(o.kyaari)) return o.kyaari as unknown[]
  const inner = toRecord(o.data)
  if (inner && Array.isArray(inner.data)) return inner.data as unknown[]
  return []
}

function normalizeKyaari(raw: unknown, fallbackIndex: number): KyaariModule | null {
  const o = toRecord(raw)
  if (!o) return null
  const id =
    toStringOrNull(o.id ?? o.kyari_id ?? o.kyaari_id) ?? `kyari-${fallbackIndex}`
  const nameFromBackend = toStringOrNull(
    o.kyari_name ?? o.kyaari_name ?? o.name,
  )
  // Product spec: render "Kyaari 1", "Kyaari 2", … when backend omits a name.
  const kyaariName = nameFromBackend ?? `Kyaari ${fallbackIndex + 1}`
  return {
    kyaariId: id,
    kyaariName,
    areaAcres: toNumber(o.area_in_acres ?? o.area_acres ?? o.area),
    treeCount: toNumber(o.tree_count ?? o.trees ?? o.number_of_trees),
    verificationStatus: normalizeStatus(o.verification_status ?? o.status),
    plantationYear: toNumberOrNull(o.plantation_year),
    plantationType: toStringOrNull(o.plantation_type),
    surveyorName: toStringOrNull(o.surveyor_name),
    createdDatetime: toNumberOrNull(o.created_datetime),
    location: toStringOrNull(o.block_name ?? o.location),
  }
}

export async function fetchKyaarisForFarm(farmId: number): Promise<KyaariModule[]> {
  // Send both `agfarm_id` and `farm_id` so the call works regardless of
  // which key the backend filters on. Unknown params are ignored.
  const url = `${getApiUrl('kyariAll')}?agfarm_id=${farmId}&farm_id=${farmId}`
  try {
    const data = await getJsonAuth<unknown>(url)
    return extractKyaariList(data)
      .map((row, i) => normalizeKyaari(row, i))
      .filter((k): k is KyaariModule => k != null)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
      return []
    }
    throw e
  }
}
