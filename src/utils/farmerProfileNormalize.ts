import type { FarmerProfileResponse } from '../types/farmer.api'

/** Nested objects on `/farmer/` that often carry KYC / identity fields. */
const NESTED_IDENTITY_KEYS = [
  'kyc',
  'kyc_details',
  'kyc_detail',
  'identity',
  'national_id',
  'national_id_details',
  'farmer_kyc',
  'verification',
  'aadhaar_details',
  'aadhar_details',
  'farmer_identity',
  'profile_kyc',
] as const

/**
 * Unwrap common API envelopes and flatten nested identity blobs so
 * Aadhaar / bank fields are visible to extractors regardless of shape.
 */
export function normalizeFarmerProfilePayload(raw: unknown): FarmerProfileResponse | null {
  const base = unwrapFarmerRecord(raw)
  if (!base) return null

  const flat: Record<string, unknown> = { ...base }

  for (const key of NESTED_IDENTITY_KEYS) {
    const nested = base[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      Object.assign(flat, nested as Record<string, unknown>)
    }
  }

  return flat as FarmerProfileResponse
}

function unwrapFarmerRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  if (looksLikeFarmerRow(o)) return o

  for (const key of ['data', 'farmer', 'profile', 'result', 'farmer_profile']) {
    const inner = o[key]
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const rec = inner as Record<string, unknown>
      if (looksLikeFarmerRow(rec)) return rec
      if (looksLikeFarmerRow(o) === false && typeof rec.data === 'object') {
        const deep = rec.data as Record<string, unknown>
        if (looksLikeFarmerRow(deep)) return deep
      }
    }
  }

  return looksLikeFarmerRow(o) ? o : null
}

function looksLikeFarmerRow(o: Record<string, unknown>): boolean {
  return (
    typeof o.id === 'number' ||
    typeof o.first_name === 'string' ||
    typeof o.mobile_number === 'string' ||
    o.farmer_address != null
  )
}
