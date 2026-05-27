import type { PortalLanguage, VerificationStatus } from './verification.types'

export type FarmerBootstrapProfile = {
  name: string
  profilePhotoUrl: string | null
  mobileNumber: string
  region: {
    state: string
    district: string
    block: string
  }
}

export type FarmerBootstrap = {
  farmerId: number
  /** String sent as `farmer_id` on KYC/BAV/verification APIs. */
  farmerApiId: string
  /** Full 12-digit Aadhaar when the profile exposes it (required for OTP trigger). */
  aadhaarNumber: string | null
  preferredLanguage: PortalLanguage
  identityConfirmed: boolean
  /** UIDAI Aadhaar OTP / eKYC API track. */
  ekycStatus: VerificationStatus
  /** Review of the uploaded Aadhaar / national ID document on file. */
  nationalIdDocumentStatus: VerificationStatus
  /** Penny-drop / BRE bank verification API track. */
  bavStatus: VerificationStatus
  /** Review of passbook / bank account document on file. */
  bankAccountDocumentStatus: VerificationStatus
  /** Backend-supplied human reason if eKYC was rejected, null otherwise. */
  ekycRejectionReason: string | null
  /** Backend-supplied human reason if BAV was rejected, null otherwise. */
  bavRejectionReason: string | null
  maskedAadhaar: string | null
  maskedBankAccountNumber: string | null
  /** Full registered account number when exposed on the profile (BAV gating). */
  registeredBankAccountNumber: string | null
  bankIfscCode: string | null
  bankName: string | null
  farmerProfile: FarmerBootstrapProfile
  farmsSummary: { count: number }
}

export type FarmCardModel = {
  farmId: number
  farmName: string
  kyaariCount: number
  projectType: 'PLANTATION' | 'RETROSPECTIVE' | 'REGEN' | 'ARR'
  farmEligibilityStatus: VerificationStatus
  craConsentStatus: VerificationStatus
  projectTypeRaw: 'REGEN' | 'ARR'
}
