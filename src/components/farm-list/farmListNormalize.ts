import type { FarmBoundaryGeometry, FarmProjectType, FarmTableRow } from '../../types/farm.api'

function readNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function readStr(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') {
    const t = v.trim()
    return t || '—'
  }
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return '—'
}

function readBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v
  if (v === 'true' || v === 'false') return v === 'true'
  return null
}

function readBoundary(v: unknown): FarmBoundaryGeometry | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if ((o.type === 'Polygon' || o.type === 'MultiPolygon') && Array.isArray(o.coordinates)) {
    return {
      type: o.type,
      coordinates: o.coordinates as FarmBoundaryGeometry['coordinates'],
    }
  }
  return null
}

export function normalizeFarmRow(
  raw: unknown,
  projectType: FarmProjectType,
): FarmTableRow | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const id = readNum(o.id)
  const farmerId = readNum(o.farmer_id)
  if (id == null || farmerId == null) return null

  const area = readNum(o.area_in_acres)
  const created = readNum(o.created_datetime)

  const cra =
    projectType === 'ARR' ? readBool(o.cra_fpic_eligible) : null

  return {
    id,
    farmName: readStr(o.farm_name),
    farmStatus: readStr(o.verification_status),
    farmerId,
    ownership: readStr(o.ownership),
    surveyorName: readStr(o.surveyor_name),
    organization: readStr(o.tenant_name),
    areaAcres: area ?? 0,
    craFpicEligible: cra,
    country: readStr(o.country_name),
    state: readStr(o.state_name),
    district: readStr(o.district_name),
    block: readStr(o.block_name),
    createdDateUnix: created ?? 0,
    boundary: readBoundary(o.boundary),
  }
}
