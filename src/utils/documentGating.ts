import type { VerificationStatus } from '../types/verification.types'

export type DocumentViewState =
  | 'LOCKED_BY_EKYC'
  | 'SKELETON_ONLY'
  | 'GENERATED'
  | 'GENERATED_SIGNED'
  | 'VIEWABLE'

export function canViewLegalDocument(
  ekycStatus: VerificationStatus,
  docVerificationStatus: string | null,
  isConsentDoc: boolean,
): { allowed: boolean; state: DocumentViewState } {
  if (isConsentDoc && ekycStatus !== 'ACCEPTED') {
    return { allowed: false, state: 'LOCKED_BY_EKYC' }
  }
  const s = (docVerificationStatus ?? '').toLowerCase()
  if (s.includes('reject')) return { allowed: false, state: 'SKELETON_ONLY' }
  if (!docVerificationStatus) return { allowed: true, state: 'VIEWABLE' }
  return { allowed: true, state: 'VIEWABLE' }
}

export function buildDocumentRoute(farmId: number, docId: number, projectType: string): string {
  return `/document/${docId}/?farmId=${farmId}&projectType=${projectType}`
}
