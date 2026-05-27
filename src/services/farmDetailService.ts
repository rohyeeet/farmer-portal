import { DEFAULT_FARM_LIST_PROJECT_TYPE, type FarmProjectType } from '../types/farm.api'
import { normalizeFarmRow } from '../components/farm-list/farmListNormalize'
import type { FarmTableRow } from '../types/farm.api'
import { fetchFarmListPage } from './farmListApi'

const PAGE_SIZE = 100
const MAX_PAGES = 5

async function findInProjectType(
  farmId: number,
  projectType: FarmProjectType,
): Promise<FarmTableRow | null> {
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    let pageResp
    try {
      pageResp = await fetchFarmListPage(projectType, {
        page_number: page,
        page_size: PAGE_SIZE,
      })
    } catch {
      return null
    }
    const rows = pageResp.data ?? []
    for (const raw of rows) {
      const row = normalizeFarmRow(raw, projectType)
      if (row?.id === farmId) return row
    }
    const totalPages = pageResp.total_pages ?? 1
    if (page >= totalPages) break
  }
  return null
}

/**
 * Locate a farm row by id, searching the requested project type first then the
 * alternate one. Paginates up to {@link MAX_PAGES} per project type before
 * giving up so deep registries still resolve.
 */
export async function fetchFarmRowById(
  farmId: number,
  projectType: FarmProjectType = DEFAULT_FARM_LIST_PROJECT_TYPE,
): Promise<{ row: FarmTableRow; projectType: FarmProjectType } | null> {
  const primary = await findInProjectType(farmId, projectType)
  if (primary) return { row: primary, projectType }
  const alt: FarmProjectType = projectType === 'ARR' ? 'REGEN' : 'ARR'
  const fallback = await findInProjectType(farmId, alt)
  if (fallback) return { row: fallback, projectType: alt }
  return null
}
