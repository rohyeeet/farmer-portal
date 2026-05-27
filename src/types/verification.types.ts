export type VerificationStatus =
  | 'MISSING'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ACCEPTED'
  | 'REJECTED'

export type PortalLanguage = 'en' | 'hi' | 'kn' | 'ta'

export const PORTAL_LANGUAGES: { code: PortalLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'தமிழ்' },
]

export function needsVerificationRemediation(
  ekyc: VerificationStatus,
  bav: VerificationStatus,
): boolean {
  const bad = (s: VerificationStatus) => s === 'MISSING' || s === 'REJECTED'
  return bad(ekyc) || bad(bav)
}

export function isFullyVerified(
  identityConfirmed: boolean,
  ekyc: VerificationStatus,
  bav: VerificationStatus,
): boolean {
  return (
    identityConfirmed &&
    ekyc === 'ACCEPTED' &&
    bav === 'ACCEPTED'
  )
}

const NEEDS_REMEDIATION = (s: VerificationStatus) =>
  s === 'MISSING' || s === 'REJECTED'

/**
 * Compute the canonical onboarding URL the user should land on.
 *
 * Per spec (Screen 4 "Confirm It's You"), the Claim Profile screen is the
 * mandatory first step of the eKYC journey — it is shown before the eKYC
 * intro whenever eKYC is not yet ACCEPTED, regardless of `identityConfirmed`.
 * Only once eKYC is ACCEPTED do we forward straight to BAV intro / home.
 *
 * The Claim screen itself uses `getPostClaimNextPath` (below) to skip to the
 * next concrete step after the user has confirmed their identity, avoiding
 * an infinite loop back to claim.
 */
export function getOnboardingNextPath(
  _identityConfirmed: boolean,
  ekyc: VerificationStatus,
  bav: VerificationStatus,
): string {
  if (ekyc !== 'ACCEPTED') return '/onboarding/claim/'
  if (NEEDS_REMEDIATION(bav)) return '/onboarding/bav-intro/'
  if (bav === 'PENDING' || bav === 'IN_PROGRESS') return '/'
  return '/'
}

/** What to navigate to after the Claim Profile screen has been handled. */
export function getPostClaimNextPath(
  ekyc: VerificationStatus,
  bav: VerificationStatus,
): string {
  if (NEEDS_REMEDIATION(ekyc)) return '/onboarding/ekyc-intro/'
  if (ekyc === 'PENDING' || ekyc === 'IN_PROGRESS') return '/'
  if (NEEDS_REMEDIATION(bav)) return '/onboarding/bav-intro/'
  return '/'
}
