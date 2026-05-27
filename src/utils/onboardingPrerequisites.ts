import type { FarmerBootstrap } from '../types/bootstrap.api'

export function hasAadhaarOnRecord(bootstrap: FarmerBootstrap): boolean {
  const digits = bootstrap.aadhaarNumber?.replace(/\D/g, '') ?? ''
  return digits.length === 12
}

/** Masked last-4 visible in UI but full number not available for OTP. */
export function hasAadhaarMaskedOnly(bootstrap: FarmerBootstrap): boolean {
  if (hasAadhaarOnRecord(bootstrap)) return false
  const masked = bootstrap.maskedAadhaar?.replace(/\D/g, '') ?? ''
  return masked.length >= 4
}

/** Registered bank on file (full account or masked with at least last 4 digits). */
export function hasBankAccountOnRecord(bootstrap: FarmerBootstrap): boolean {
  const full = bootstrap.registeredBankAccountNumber?.replace(/\D/g, '') ?? ''
  if (full.length >= 6) return true
  const masked = bootstrap.maskedBankAccountNumber?.replace(/\D/g, '') ?? ''
  return masked.length >= 4
}
