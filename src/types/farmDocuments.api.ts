import type { FarmProjectType } from './farm.api'

export type FarmMediaDoc = {
  id: number
  refType: string
  refSubType: string
  mediaUrl: string | null
  contentType: string | null
  filename: string | null
  verificationStatus: string | null
  verificationRemarks: string | null
  createdDatetime: number | null
  /** Free-form metadata blob (EXIF, capture device, etc.) when present. */
  metadata: Record<string, unknown> | null
  /** Geo-location captured at upload time. */
  geoLocation: {
    latitude: number | null
    longitude: number | null
    accuracy: number | null
  } | null
  /** AI / Gemini analysis result (summary, classification, etc.). */
  geminiResult: Record<string, unknown> | null
}

export type FarmDocumentBucket = {
  refSubType: string
  label: string
  docs: FarmMediaDoc[]
}

export type RefSubTypeConfig = {
  value: string
  label: string
}

export type ProjectDocConfig = {
  refType: string
  refSubTypes: RefSubTypeConfig[]
}

export type FarmDocsByProjectMap = Record<FarmProjectType, ProjectDocConfig>
