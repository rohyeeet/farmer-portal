import type { VerificationStatus } from '../types/verification.types'
import { combineStatuses, type CardStatus } from './farmCardStatusCompute'

/** Worst-of summary for profile hub collapsed rows (two verification tracks). */
export function summarizeVerificationStatuses(
  statuses: VerificationStatus[],
): VerificationStatus {
  const normalized: CardStatus[] = statuses.map((s) =>
    s === 'IN_PROGRESS' ? 'PENDING' : s,
  ) as CardStatus[]
  return combineStatuses(normalized)
}
