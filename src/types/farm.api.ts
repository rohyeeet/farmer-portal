/** UI / query project type — drives which list API is called */
export type FarmProjectType = 'REGEN' | 'ARR'

/** Farm list default — matches Studio farms behaviour */
export const DEFAULT_FARM_LIST_PROJECT_TYPE: FarmProjectType = 'ARR'

export type FarmListPageResponse = {
  page_size: number
  total_count: number
  page_number: number
  total_pages: number
  next: string | null
  previous: string | null
  data: unknown[]
}

export type FarmBoundaryGeometry = {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

/** Normalized row for the farm table */
export type FarmTableRow = {
  id: number
  farmName: string
  farmStatus: string
  farmerId: number
  ownership: string
  surveyorName: string
  organization: string
  areaAcres: number
  /** Only meaningful for ARR; `null` for REGEN */
  craFpicEligible: boolean | null
  country: string
  state: string
  district: string
  block: string
  createdDateUnix: number
  boundary: FarmBoundaryGeometry | null
}
