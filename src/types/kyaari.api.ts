import type { VerificationStatus } from './verification.types'

export type KyaariModule = {
  kyaariId: string
  kyaariName: string
  areaAcres: number
  treeCount: number
  verificationStatus: VerificationStatus
  /** Optional richer fields the backend exposes today. All nullable so
   *  responses that omit them still parse cleanly. */
  plantationYear?: number | null
  plantationType?: string | null
  surveyorName?: string | null
  createdDatetime?: number | null
  location?: string | null
}
