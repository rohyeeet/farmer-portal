import { getApiUrl } from '../config/apiRegistry'
import type { FarmListPageResponse, FarmProjectType } from '../types/farm.api'
import { getJsonAuth } from './http/getJsonAuth'

export type FarmListRequestQuery = {
  page_number: number
  page_size: number
  search?: string
  verification_status?: string
  start_datetime?: number
  end_datetime?: number
  country_id?: number
  state_id?: number
  district_id?: number
  block_id?: number
}

function appendParams(sp: URLSearchParams, q: FarmListRequestQuery): void {
  sp.set('page_number', String(q.page_number))
  sp.set('page_size', String(q.page_size))
  if (q.search?.trim()) sp.set('search', q.search.trim())
  if (q.verification_status?.trim()) sp.set('verification_status', q.verification_status.trim())
  if (q.start_datetime != null) sp.set('start_datetime', String(q.start_datetime))
  if (q.end_datetime != null) sp.set('end_datetime', String(q.end_datetime))
  if (q.country_id != null) sp.set('country_id', String(q.country_id))
  if (q.state_id != null) sp.set('state_id', String(q.state_id))
  if (q.district_id != null) sp.set('district_id', String(q.district_id))
  if (q.block_id != null) sp.set('block_id', String(q.block_id))
}

export async function fetchFarmListPage(
  projectType: FarmProjectType,
  query: FarmListRequestQuery,
): Promise<FarmListPageResponse> {
  const base =
    projectType === 'REGEN' ? getApiUrl('regenFarmAll') : getApiUrl('arrFarmAll')
  const sp = new URLSearchParams()
  appendParams(sp, query)
  const url = `${base}?${sp.toString()}`
  return getJsonAuth<FarmListPageResponse>(url)
}
