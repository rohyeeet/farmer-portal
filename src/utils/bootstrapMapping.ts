import type { FarmerProfileResponse } from '../types/farmer.api'
import type { FarmerBootstrap, FarmerBootstrapProfile } from '../types/bootstrap.api'
import type { PortalLanguage, VerificationStatus } from '../types/verification.types'
import type { FarmerVerificationStatusResponse } from '../services/onboardingApi'
import {
  extractAadhaarNumber,
  extractRegisteredBankAccountNumber,
  maskAadhaarFromFull,
  resolveFarmerApiId,
} from './farmerApiId'
import { normalizeFarmerProfilePayload } from './farmerProfileNormalize'
import {
  BAV_API_STATUS_KEYS,
  BANK_ACCOUNT_DOCUMENT_STATUS_KEYS,
  EKYC_API_STATUS_KEYS,
  NATIONAL_ID_DOCUMENT_STATUS_KEYS,
  normalizeVerificationStatus,
  pickVerificationStatus,
} from './identityVerificationFields'

export { normalizeVerificationStatus as readVerificationStatus }

const LANG_KEY = 'fp_preferred_language'

export function readStoredLanguage(): PortalLanguage {
  try {
    const v = localStorage.getItem(LANG_KEY)
    if (v === 'hi' || v === 'kn' || v === 'ta' || v === 'en') return v
  } catch {
    /* ignore */
  }
  return 'en'
}

export function writeStoredLanguage(lang: PortalLanguage): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* ignore */
  }
}

function buildRegion(address: FarmerProfileResponse['farmer_address']): FarmerBootstrapProfile['region'] {
  return {
    state: address?.state_name?.trim() || '—',
    district: address?.district_name?.trim() || '—',
    block: address?.block_name?.trim() || '—',
  }
}

function buildName(profile: FarmerProfileResponse): string {
  const parts = [profile.first_name, profile.last_name].filter(Boolean)
  return parts.join(' ').trim() || 'Farmer'
}

/**
 * Robust masked-Aadhaar extraction. Backends in this stack have shipped
 * the value under several different keys across releases; we also accept
 * a full 12-digit number and mask it ourselves so the UI can always
 * surface the last four digits when ANY form of Aadhaar is on record.
 */
export function extractMaskedAadhaar(
  source: Record<string, unknown>,
): string | null {
  const candidates: Array<unknown> = [
    source.masked_aadhaar,
    source.masked_aadhar,
    source.aadhaar_masked,
    source.aadhar_masked,
    source.aadhaar_number_masked,
    source.aadhar_number_masked,
    source.aadhaar_number,
    source.aadhar_number,
    source.aadhaar,
    source.aadhar,
  ]
  const last4Candidates: Array<unknown> = [
    source.aadhaar_last_4,
    source.aadhar_last_4,
    source.aadhaar_last4,
    source.aadhar_last4,
  ]

  for (const raw of candidates) {
    if (typeof raw !== 'string') continue
    const cleaned = raw.replace(/\s+/g, '').trim()
    if (!cleaned) continue
    const digits = cleaned.match(/\d+/g)?.join('') ?? ''
    if (digits.length >= 4) {
      const last4 = digits.slice(-4)
      return `XXXX XXXX ${last4}`
    }
    // String present but unmaskable (e.g. only X's) — return as-is in
    // the canonical 4-4-4 layout if possible.
    const normalised = cleaned.match(/.{1,4}/g)?.join(' ')
    if (normalised) return normalised.toUpperCase()
  }
  for (const raw of last4Candidates) {
    const s =
      typeof raw === 'string'
        ? raw
        : typeof raw === 'number'
          ? String(raw)
          : null
    if (!s) continue
    const last4 = s.replace(/\D/g, '').slice(-4)
    if (last4.length === 4) return `XXXX XXXX ${last4}`
  }
  return null
}

/** Same idea for bank accounts — return masked form with last 4 visible. */
function extractMaskedBankAccount(
  source: Record<string, unknown>,
): string | null {
  const candidates: Array<unknown> = [
    source.masked_bank_account,
    source.masked_bank_account_number,
    source.bank_account_number_masked,
    source.bank_account_number,
    source.account_number,
  ]
  for (const raw of candidates) {
    if (typeof raw !== 'string' && typeof raw !== 'number') continue
    const cleaned = String(raw).replace(/\s+/g, '').trim()
    if (!cleaned) continue
    const digits = cleaned.match(/\d+/g)?.join('') ?? ''
    if (digits.length >= 4) {
      return `•••• •••• ${digits.slice(-4)}`
    }
    return cleaned
  }
  return null
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = source[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

function overlayVerificationFields(
  ext: Record<string, unknown>,
  verification?: FarmerVerificationStatusResponse | null,
): void {
  if (!verification) return
  // BRE wraps verification fields inside a `data` envelope; flatten it first.
  const raw = verification as Record<string, unknown>
  const v: Record<string, unknown> =
    raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
      ? { ...raw.data as Record<string, unknown>, ...raw }
      : raw
  if (v.ekyc_status != null) ext.ekyc_status = v.ekyc_status
  if (v.ekycStatus != null) ext.ekyc_status = v.ekycStatus
  if (v.bav_status != null) ext.bav_status = v.bav_status
  if (v.bavStatus != null) ext.bav_status = v.bavStatus
  if (v.kyc_status != null && ext.ekyc_status == null) {
    ext.ekyc_status = v.kyc_status
  }
  if (v.masked_aadhaar != null) ext.masked_aadhaar = v.masked_aadhaar
  if (v.maskedAadhaar != null) ext.masked_aadhaar = v.maskedAadhaar
  if (v.aadhaar_number != null) ext.aadhaar_number = v.aadhaar_number
  if (v.aadhaarNumber != null) ext.aadhaar_number = v.aadhaarNumber
  if (v.aadhar_number != null) ext.aadhar_number = v.aadhar_number
  if (v.unmasked_aadhaar != null) ext.unmasked_aadhaar = v.unmasked_aadhaar
  if (v.identity_confirmed != null) ext.identity_confirmed = v.identity_confirmed
  if (v.identityConfirmed != null) ext.identity_confirmed = v.identityConfirmed
  if (v.ekyc_rejection_reason != null) {
    ext.ekyc_rejection_reason = v.ekyc_rejection_reason
  }
  if (v.bav_rejection_reason != null) {
    ext.bav_rejection_reason = v.bav_rejection_reason
  }
  for (const key of NATIONAL_ID_DOCUMENT_STATUS_KEYS) {
    if (v[key] != null) ext[key] = v[key]
  }
  for (const key of BANK_ACCOUNT_DOCUMENT_STATUS_KEYS) {
    if (v[key] != null) ext[key] = v[key]
  }
}

export function mapFarmerToBootstrap(
  profile: FarmerProfileResponse,
  farmsCount: number,
  preferredLanguage?: PortalLanguage,
  verification?: FarmerVerificationStatusResponse | null,
): FarmerBootstrap {
  const normalized = normalizeFarmerProfilePayload(profile) ?? profile
  const ext = normalized as FarmerProfileResponse & Record<string, unknown> & {
    ekyc_status?: string
    bav_status?: string
    identity_confirmed?: boolean
  }
  overlayVerificationFields(ext, verification)

  const ekycStatus =
    pickVerificationStatus(ext, [...EKYC_API_STATUS_KEYS]) ??
    normalizeVerificationStatus(ext.ekyc_status, profile.kyc_status)
  const nationalIdDocumentStatus =
    pickVerificationStatus(ext, [...NATIONAL_ID_DOCUMENT_STATUS_KEYS]) ?? 'MISSING'
  const bavStatus =
    pickVerificationStatus(ext, [...BAV_API_STATUS_KEYS]) ??
    normalizeVerificationStatus(ext.bav_status)
  const bankAccountDocumentStatus =
    pickVerificationStatus(ext, [...BANK_ACCOUNT_DOCUMENT_STATUS_KEYS]) ?? 'MISSING'
  const identityConfirmed =
    ext.identity_confirmed === true || profile.farmer_consent === true

  // Backend may surface rejection reasons under several aliases; treat
  // them as optional and only populate when status === REJECTED so we
  // never accidentally show a stale reason after a re-verification.
  const ekycRejectionReason =
    ekycStatus === 'REJECTED'
      ? pickString(ext, [
          'ekyc_rejection_reason',
          'kyc_rejection_reason',
          'ekyc_remarks',
          'kyc_remarks',
          'ekyc_reject_reason',
          'kyc_reject_reason',
          'ekyc_verification_remarks',
          'verification_remarks',
        ])
      : null
  const bavRejectionReason =
    bavStatus === 'REJECTED'
      ? pickString(ext, [
          'bav_rejection_reason',
          'bav_remarks',
          'bav_reject_reason',
          'bank_verification_remarks',
        ])
      : null

  return {
    farmerId: profile.id,
    farmerApiId: resolveFarmerApiId(ext, profile.id),
    aadhaarNumber: extractAadhaarNumber(ext),
    preferredLanguage: preferredLanguage ?? readStoredLanguage(),
    identityConfirmed,
    ekycStatus,
    nationalIdDocumentStatus,
    bavStatus,
    bankAccountDocumentStatus,
    ekycRejectionReason,
    bavRejectionReason,
    maskedAadhaar:
      extractMaskedAadhaar(ext) ??
      (() => {
        const full = extractAadhaarNumber(ext)
        return full ? maskAadhaarFromFull(full) : null
      })(),
    maskedBankAccountNumber: extractMaskedBankAccount(ext),
    registeredBankAccountNumber: extractRegisteredBankAccountNumber(ext),
    bankIfscCode: pickString(ext, [
      'ifsc_code',
      'ifsc',
      'bank_ifsc',
      'bank_ifsc_code',
      'registered_ifsc',
    ]),
    bankName: pickString(ext, [
      'bank_name',
      'bank',
      'registered_bank_name',
      'bank_name_on_record',
    ]),
    farmerProfile: {
      name: buildName(profile),
      profilePhotoUrl:
        profile.farmer_profile_picture?.thumbnail_url ??
        profile.farmer_profile_picture?.media_url ??
        null,
      mobileNumber: profile.mobile_number ?? '',
      region: buildRegion(profile.farmer_address),
    },
    farmsSummary: { count: farmsCount },
  }
}

export function mapVerificationToChip(status: VerificationStatus): 'accepted' | 'pending' | 'rejected' | 'default' {
  if (status === 'ACCEPTED') return 'accepted'
  if (status === 'REJECTED') return 'rejected'
  if (status === 'IN_PROGRESS' || status === 'PENDING') return 'pending'
  return 'default'
}
