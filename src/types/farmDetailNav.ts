import type { FarmProjectType, FarmTableRow } from './farm.api'

export type FarmDetailLocationState = {
  row: FarmTableRow
  projectType: FarmProjectType
}

const cacheKey = (farmId: number, projectType: FarmProjectType) =>
  `fp_farm_detail_row_v1_${farmId}_${projectType}`

export function persistFarmDetailNav(data: FarmDetailLocationState): void {
  try {
    sessionStorage.setItem(
      cacheKey(data.row.id, data.projectType),
      JSON.stringify(data),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

export function readFarmDetailNavFromCache(
  farmId: number,
  projectType: FarmProjectType,
): FarmDetailLocationState | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(farmId, projectType))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (!o.row || typeof o.row !== 'object') return null
    if (o.projectType !== 'REGEN' && o.projectType !== 'ARR') return null
    return {
      row: o.row as FarmTableRow,
      projectType: o.projectType as FarmProjectType,
    }
  } catch {
    return null
  }
}
