import type { FarmerBootstrap } from '../types/bootstrap.api'
import { maskAadhaarFromFull } from './farmerApiId'
import { readOnboardingAadhaar } from './onboardingDraft'
import { hasAadhaarOnRecord } from './onboardingPrerequisites'

/** Aadhaar for KYC OTP: profile API first, then value entered in onboarding. */
export function resolveAadhaarForEkyc(bootstrap: FarmerBootstrap | null): string | null {
  if (bootstrap && hasAadhaarOnRecord(bootstrap)) {
    return bootstrap.aadhaarNumber!.replace(/\D/g, '')
  }
  return readOnboardingAadhaar()
}

export function canProceedToEkycOtp(bootstrap: FarmerBootstrap | null): boolean {
  return resolveAadhaarForEkyc(bootstrap) != null
}

export function displayMaskedAadhaar(
  bootstrap: FarmerBootstrap | null,
  overrideDigits?: string | null,
): string {
  const fromProfile = bootstrap?.maskedAadhaar?.trim()
  if (fromProfile && fromProfile.replace(/\D/g, '').length >= 4) return fromProfile
  const digits = overrideDigits ?? resolveAadhaarForEkyc(bootstrap)
  if (digits) return maskAadhaarFromFull(digits)
  return 'XXXX XXXX XXXX'
}
