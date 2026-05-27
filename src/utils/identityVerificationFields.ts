import type { VerificationStatus } from '../types/verification.types'

/** Normalise backend verification enums (see API_INTEGRATION §0). */
export function normalizeVerificationStatus(
  raw: unknown,
  booleanFallback?: boolean | null,
): VerificationStatus {
  if (typeof raw === 'boolean') {
    return raw ? 'ACCEPTED' : 'MISSING'
  }
  if (typeof raw === 'string') {
    const u = raw.toUpperCase().replace(/ /g, '_')
    if (u === 'DECLINED') return 'REJECTED'
    if (
      u === 'MISSING' ||
      u === 'PENDING' ||
      u === 'IN_PROGRESS' ||
      u === 'ACCEPTED' ||
      u === 'REJECTED'
    ) {
      return u as VerificationStatus
    }
  }
  if (booleanFallback === true) return 'ACCEPTED'
  if (booleanFallback === false) return 'MISSING'
  return 'MISSING'
}

export function pickVerificationStatus(
  source: Record<string, unknown>,
  keys: string[],
): VerificationStatus | null {
  for (const key of keys) {
    if (!(key in source)) continue
    const raw = source[key]
    if (raw == null) continue
    return normalizeVerificationStatus(raw)
  }
  return null
}

/** UIDAI / Aadhaar OTP API track (`ekyc_status`). */
export const EKYC_API_STATUS_KEYS = [
  'ekyc_status',
  'ekycStatus',
  'kyc_status',
  'kycStatus',
] as const

/** Uploaded Aadhaar card / national ID document review track. */
export const NATIONAL_ID_DOCUMENT_STATUS_KEYS = [
  'national_id_document_verification_status',
  'national_id_document_status',
  'national_id_verification_status',
  'aadhaar_document_verification_status',
  'aadhaar_document_status',
  'aadhaar_card_verification_status',
  'aadhaar_card_status',
  'id_card_verification_status',
  'farmer_aadhaar_verification_status',
] as const

/** Penny-drop / BRE bank API track (`bav_status`). */
export const BAV_API_STATUS_KEYS = ['bav_status', 'bavStatus'] as const

/** Passbook / registered bank account document review track. */
export const BANK_ACCOUNT_DOCUMENT_STATUS_KEYS = [
  'bank_account_verification_status',
  'bank_account_document_verification_status',
  'bank_account_document_status',
  'bank_document_verification_status',
  'passbook_verification_status',
  'registered_bank_verification_status',
  'registered_bank_account_verification_status',
] as const
