import { getApiBaseUrl } from './env'
import { ensureApiTrailingSlash } from './apiUrl'

/**
 * Registered API paths (relative to {@link getApiBaseUrl}).
 *
 * This list is the ENTIRE backend surface the portal hits. Nine endpoints,
 * grouped into four buckets:
 *
 *   Auth (4)   — login OTP request / resend / validate, logout
 *   Profile (1) — the existing Farmer Data API
 *   Farms (2)   — REGEN and ARR farm listings
 *   Media (1)   — the existing media/all API (PDFs, photos, gemini results)
 *   KYC + BAV (5) — Aadhaar OTP/verify, kyc-status update, verification-status, BRE BAV
 *
 * If you need data not covered here, prefer extending one of the existing
 * endpoints over adding a new key.
 */
export const apiRegistry = {
  loginOtp: '/api/mobile/v2/login-otp/',
  loginOtpResend: '/api/mobile/v2/login-otp/resend/',
  loginValidate: '/api/mobile/v2/login-validate/',
  logout: '/api/mobile/v2/logout/',

  farmerProfile: '/api/mobile/v2/farmer/',

  regenFarmAll: '/api/mobile/v2/farm/all/',
  arrFarmAll: '/api/mobile/v2/agfarm/all/',

  farmMediaAll: '/api/mobile/v2/media/all/',

  /** Per-farm kyaari listing. Backend uses the singular spelling
   *  "kyari" at the root of /api/mobile/v2/ and filters by query
   *  param `?agfarm_id=<id>` (some deployments accept `?farm_id=<id>`
   *  as a fallback — `kyariApi.ts` sends both for safety).
   *  Consumed by Home (status computation) and Farm Detail (kyaari rows). */
  kyariAll: '/api/mobile/v2/kyari/all/',

  /** KYC OTP trigger — Body: `{ farmer_id, aadhaar_number, consent }`.
   *  Dev: proxied via src/app/bre/[...path]/route.ts → KYC_PROXY_TARGET. */
  kycAadhaarOtp: '/bre/v1/farmer/kyc/aadhaar/otp/',
  /** KYC OTP verify — Body: `{ farmer_id, reference_id, otp }`.
   *  Dev: proxied via src/app/bre/[...path]/route.ts → KYC_PROXY_TARGET. */
  kycAadhaarVerify: '/bre/v1/farmer/kyc/aadhaar/verify/',
  /** KYC status write after eKYC step. Body: `{ farmer_id, kyc_status }`.
   *  Dev: proxied via src/app/api/mobile/v2/farmer/[...path]/route.ts → KYC_PROXY_TARGET. */
  kycStatusUpdate: '/api/mobile/v2/farmer/kyc-status/update',
  /** Current verification snapshot. Body: `{ farmer_id }`.
   *  Dev: proxied via src/app/api/mobile/v2/farmer/[...path]/route.ts → KYC_PROXY_TARGET. */
  farmerVerificationStatus: '/api/mobile/v2/farmer/verification-status',
  /** Bank Account Verification. Body: `{ farmer_id, ifsc, account_number }`.
   *  Dev: proxied via src/app/bre/[...path]/route.ts → KYC_PROXY_TARGET. */
  bankVerification: '/bre/v1/farmer/bav/',
} as const

export type ApiRegistryKey = keyof typeof apiRegistry

export function getApiUrl(key: ApiRegistryKey): string {
  return ensureApiTrailingSlash(`${getApiBaseUrl()}${apiRegistry[key]}`)
}

/**
 * Resolves a registry path that contains `{param}` placeholders by
 * substituting the provided values. Use for endpoints like
 * `agfarmKyaariAll` whose path includes the farm id.
 *
 * @example getApiUrlWithPath('agfarmKyaariAll', { farm_id: 1234 })
 *   // → 'https://.../api/mobile/v2/agfarm/1234/kyaari/all/'
 */
export function getApiUrlWithPath(
  key: ApiRegistryKey,
  params: Record<string, string | number>,
): string {
  const filled = Object.entries(params).reduce(
    (acc, [name, value]) =>
      acc.replace(`{${name}}`, encodeURIComponent(String(value))),
    apiRegistry[key] as string,
  )
  return ensureApiTrailingSlash(`${getApiBaseUrl()}${filled}`)
}
