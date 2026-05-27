import type {
  FarmDocsByProjectMap,
  FarmDocumentBucket,
  FarmMediaDoc,
} from '../types/farmDocuments.api'
import type { FarmProjectType } from '../types/farm.api'
import { getApiUrl } from '../config/apiRegistry'
import { getJsonAuth } from './http/getJsonAuth'

/**
 * Document buckets the farm-detail screen renders.
 *
 * `category` controls where each bucket appears:
 * - `digital_consent` → "Digital Consents" section. Only the digitally-signed
 *   CRA and FPIC documents live here. Locked until eKYC is ACCEPTED.
 * - `documentation`   → "Documentation" section. Farmer-supplied paperwork
 *   (land records, declarations, photo evidence, holding consent) and the
 *   non-digital FPIC variants. Always viewable when present.
 */
export type DocBucketCategory = 'digital_consent' | 'documentation'

/**
 * Bucket order here directly drives the display order on the Farm
 * Detail screen. Per the product spec the priority is:
 *   1. Land Document
 *   2. Land Declaration
 *   3. Farmer Holding Consent
 *   4. FPIC
 *   5. FPIC Local
 * Digital Consents (CRA, FPIC) live in their own section above.
 * (ID Card is a farmer-level artefact and is not surfaced per-farm.)
 */
export const FARM_DOC_BUCKETS: ReadonlyArray<{
  value: string
  labelKey: string
  category: DocBucketCategory
}> = [
  { value: 'AgroFarmDigitalCRA', labelKey: 'doc_bucket_digital_cra', category: 'digital_consent' },
  { value: 'AgroFarmDigitalFPIC', labelKey: 'doc_bucket_digital_fpic', category: 'digital_consent' },
  { value: 'AgroFarmLandRecord', labelKey: 'doc_bucket_land_record', category: 'documentation' },
  { value: 'AgroFarmLandLordDeclaration', labelKey: 'doc_bucket_landlord_declaration', category: 'documentation' },
  { value: 'AgroFarmHoldingConsent', labelKey: 'doc_bucket_holding_consent', category: 'documentation' },
  { value: 'AgroFarmFPIC', labelKey: 'doc_bucket_fpic', category: 'documentation' },
  { value: 'AgroFarmFPICLocal', labelKey: 'doc_bucket_fpic_local', category: 'documentation' },
  { value: 'AgroFarmImage', labelKey: 'doc_bucket_farm_image', category: 'documentation' },
]

const FARM_DOC_BUCKET_BY_VALUE = new Map(FARM_DOC_BUCKETS.map((b) => [b.value, b]))

export function getDocBucketCategory(value: string): DocBucketCategory | null {
  return FARM_DOC_BUCKET_BY_VALUE.get(value)?.category ?? null
}

export function getDocBucketLabelKey(value: string): string | null {
  return FARM_DOC_BUCKET_BY_VALUE.get(value)?.labelKey ?? null
}

export const FARM_DOCS_BY_PROJECT: FarmDocsByProjectMap = {
  ARR: {
    refType: 'AgroFarm',
    refSubTypes: FARM_DOC_BUCKETS.map(({ value, labelKey }) => ({ value, label: labelKey })),
  },
  REGEN: {
    refType: 'AgroFarm',
    refSubTypes: FARM_DOC_BUCKETS.map(({ value, labelKey }) => ({ value, label: labelKey })),
  },
}

function toRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function normalizeGeoLocation(raw: unknown): FarmMediaDoc['geoLocation'] {
  const o = toRecord(raw)
  if (!o) return null
  const lat = toNumberOrNull(o.latitude ?? o.lat)
  const lng = toNumberOrNull(o.longitude ?? o.lng ?? o.lon)
  const acc = toNumberOrNull(o.accuracy)
  if (lat == null && lng == null && acc == null) return null
  return { latitude: lat, longitude: lng, accuracy: acc }
}

function normalizeDoc(raw: unknown): FarmMediaDoc | null {
  const o = toRecord(raw)
  if (!o) return null
  const id = toNumberOrNull(o.id)
  if (id == null) return null
  return {
    id,
    refType: toStringOrNull(o.ref_type) ?? '',
    refSubType: toStringOrNull(o.ref_sub_type) ?? '',
    mediaUrl: toStringOrNull(o.media_url),
    contentType: toStringOrNull(o.content_type),
    filename: toStringOrNull(o.filename),
    verificationStatus: toStringOrNull(o.verification_status),
    verificationRemarks: toStringOrNull(o.verification_remarks),
    createdDatetime: toNumberOrNull(o.created_datetime),
    metadata: toRecord(o.metadata),
    geoLocation: normalizeGeoLocation(o.geo_location),
    geminiResult: toRecord(o.gemini_result),
  }
}

function sortByLatest(a: FarmMediaDoc, b: FarmMediaDoc): number {
  return (b.createdDatetime ?? 0) - (a.createdDatetime ?? 0)
}

/**
 * Pulls the array payload out of the media/all response. The endpoint
 * has historically been served as a bare array, but the backend may
 * return a DRF-style envelope (`{ data: [...] }`, `{ results: [...] }`)
 * or wrap by ref_sub_type. We try each shape in order so the UI
 * doesn't silently swallow real docs.
 */
function extractMediaList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.results)) return o.results
    if (Array.isArray(o.media)) return o.media
    if (Array.isArray(o.docs)) return o.docs
  }
  return []
}

async function fetchBuckets(
  refType: string,
  refId: number,
  refSubTypes: ReadonlyArray<{ value: string; label: string }>,
): Promise<FarmDocumentBucket[]> {
  const params = new URLSearchParams({
    ref_type: refType,
    ref_id: `${refId}`,
    ref_sub_type: refSubTypes.map((s) => s.value).join(','),
  })
  const url = `${getApiUrl('farmMediaAll')}?${params.toString()}`
  const data = await getJsonAuth<unknown>(url)
  const list = extractMediaList(data)
  const docs = list.map(normalizeDoc).filter((d): d is FarmMediaDoc => d != null).sort(sortByLatest)

  const bySubType = new Map<string, FarmMediaDoc[]>()
  for (const doc of docs) {
    const key = doc.refSubType
    if (!key) continue
    const current = bySubType.get(key)
    if (current) {
      current.push(doc)
    } else {
      bySubType.set(key, [doc])
    }
  }

  return refSubTypes.map((subType) => ({
    refSubType: subType.value,
    label: subType.label,
    docs: bySubType.get(subType.value) ?? [],
  }))
}

/**
 * Fetches the documentation buckets for a farm via `/media/all/`.
 *
 * Both ARR and REGEN project types are supported — the same `ref_type`
 * (`AgroFarm`) and `ref_sub_type` vocabulary covers both, so the
 * backend serves the same media surface for either. If the backend
 * uses a different `ref_type` for REGEN, add a project-specific entry
 * in {@link FARM_DOCS_BY_PROJECT} above.
 */
export async function fetchFarmDocumentsByProject(
  projectType: FarmProjectType,
  farmId: number,
): Promise<FarmDocumentBucket[]> {
  const cfg = FARM_DOCS_BY_PROJECT[projectType]
  if (!cfg) return []
  return fetchBuckets(cfg.refType, farmId, cfg.refSubTypes)
}
