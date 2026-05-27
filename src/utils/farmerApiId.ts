/**
 * Resolves the `farmer_id` string the KYC/BAV/verification endpoints expect.
 * Examples from backend docs use values like `"farmer_001"`; live profiles
 * may expose a string `farmer_id` field or fall back to the numeric `id`.
 */
export function resolveFarmerApiId(
  profile: Record<string, unknown>,
  numericId: number,
): string {
  for (const key of ['farmer_id', 'farmerId', 'external_farmer_id']) {
    const v = profile[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return String(numericId)
}

const AADHAAR_FLAT_KEYS = [
  'aadhaar_number',
  'aadhar_number',
  'aadhaar_no',
  'aadhar_no',
  'aadhaar',
  'aadhar',
  'unmasked_aadhaar',
  'unmasked_aadhar',
  'aadhaarNumber',
  'aadharNumber',
  'national_id_number',
  'national_id_no',
  'uidai_aadhaar_number',
  'uidai_aadhar_number',
] as const

const AADHAAR_KEY_PATTERN = /aadhaar|aadhar|national_id/i
const SKIP_KEY_PATTERN = /mobile|phone|pincode|pin_code|otp|reference/i

function digitsOnly(raw: unknown): string {
  if (raw == null) return ''
  return String(raw).replace(/\D/g, '')
}

function tryTwelveDigits(raw: unknown): string | null {
  const digits = digitsOnly(raw)
  if (digits.length === 12) return digits
  return null
}

function extractFromFlat(source: Record<string, unknown>): string | null {
  for (const key of AADHAAR_FLAT_KEYS) {
    const found = tryTwelveDigits(source[key])
    if (found) return found
  }
  return null
}

/**
 * Walk the profile (and nested objects) for any 12-digit Aadhaar value
 * on a field whose name suggests Aadhaar / national ID.
 */
function deepFindAadhaar(source: Record<string, unknown>, depth = 0): string | null {
  if (depth > 5) return null

  const direct = extractFromFlat(source)
  if (direct) return direct

  for (const [key, value] of Object.entries(source)) {
    if (SKIP_KEY_PATTERN.test(key)) continue
    if (!AADHAAR_KEY_PATTERN.test(key)) continue
    const found = tryTwelveDigits(value)
    if (found) return found
  }

  for (const value of Object.values(source)) {
    if (value == null || typeof value !== 'object') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          const found = deepFindAadhaar(item as Record<string, unknown>, depth + 1)
          if (found) return found
        }
      }
      continue
    }
    const found = deepFindAadhaar(value as Record<string, unknown>, depth + 1)
    if (found) return found
  }

  return null
}

/** Full 12-digit Aadhaar required for OTP trigger (not the masked display value). */
export function extractAadhaarNumber(
  source: Record<string, unknown>,
): string | null {
  return extractFromFlat(source) ?? deepFindAadhaar(source)
}

/** True when profile exposes masked Aadhaar / last-4 but not the full number. */
export function hasMaskedAadhaarHint(source: Record<string, unknown>): boolean {
  const last4Keys = ['aadhaar_last_4', 'aadhar_last_4', 'aadhaar_last4', 'aadhar_last4']
  for (const key of last4Keys) {
    if (digitsOnly(source[key]).length >= 4) return true
  }
  for (const key of ['masked_aadhaar', 'masked_aadhar', 'aadhaar_number', 'aadhaar']) {
    const raw = source[key]
    if (typeof raw !== 'string') continue
    const digits = digitsOnly(raw)
    if (digits.length >= 4 && digits.length < 12) return true
    if (/X{4,}/i.test(raw) && digits.length >= 4) return true
  }
  return false
}

/** Registered bank account digits on the farmer profile (for BAV reference / gating). */
export function extractRegisteredBankAccountNumber(
  source: Record<string, unknown>,
): string | null {
  const keys = [
    'bank_account_number',
    'account_number',
    'registered_bank_account',
    'registered_account_number',
    'bank_account_number_masked',
    'bankAccountNumber',
    'registered_account_no',
  ]
  for (const key of keys) {
    const raw = source[key]
    if (raw == null) continue
    const digits = String(raw).replace(/\D/g, '')
    if (digits.length >= 6 && digits.length <= 20) return digits
  }
  return null
}

export function maskAadhaarFromFull(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.length < 4) return 'XXXX XXXX XXXX'
  return `XXXX XXXX ${d.slice(-4)}`
}
