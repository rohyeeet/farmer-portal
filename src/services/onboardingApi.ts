import { getApiUrl } from '../config/apiRegistry'
import type { VerificationStatus } from '../types/verification.types'
import { postJsonAuth } from './http/postJsonAuth'

export type AadhaarConsent = 'y' | 'n'

export type OnboardingFarmerContext = {
  /** Value sent as `farmer_id` in KYC/BAV/verification request bodies. */
  farmerApiId: string
}

export type AadhaarConsentOtpBody = {
  aadhaarNumber: string
  consent: AadhaarConsent
}

export type AadhaarConsentOtpResponse = {
  success?: boolean
  code?: number | string
  info?: string
  message?: string
  // BRE envelope — reference_id lives inside data.reference_id
  data?: {
    reference_id?: number | string
    ref_id?: number | string
    transaction_id?: string
    message?: string
    masked_aadhaar?: string
    maskedAadhaar?: string
    [key: string]: unknown
  }
  // Flat variants (non-BRE backends / older contracts)
  reference_id?: number | string
  referenceId?: number | string
  ref_id?: number | string
  transaction_id?: string
  txn_id?: string
  request_id?: string
  maskedAadhaar?: string
  masked_aadhaar?: string
}

export async function postAadhaarConsentOtp(
  ctx: OnboardingFarmerContext,
  body: AadhaarConsentOtpBody,
  options?: { signal?: AbortSignal },
): Promise<AadhaarConsentOtpResponse> {
  const digits = body.aadhaarNumber.replace(/\D/g, '')
  return postJsonAuth(
    getApiUrl('kycAadhaarOtp'),
    {
      farmer_id: ctx.farmerApiId,
      aadhaar_number: digits,
      consent: body.consent,
    },
    options,
  )
}

export function extractReferenceId(
  res: AadhaarConsentOtpResponse | null | undefined,
): string | null {
  if (!res) return null
  // Check nested data envelope first (BRE format), then flat fields.
  // Accepts both `reference_id` (BRE) and `transaction_id` (backendtest).
  const raw =
    res.data?.transaction_id ??
    res.data?.reference_id ??
    res.data?.ref_id ??
    res.transaction_id ??
    res.reference_id ??
    res.referenceId ??
    res.ref_id ??
    res.txn_id ??
    res.request_id
  if (raw == null) return null
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw) && raw !== 0) return String(raw)
  return null
}

export type AadhaarVerifyOtpBody = {
  referenceId: string
  otp: string
}

export type AadhaarVerifyOtpResponse = {
  success?: boolean
  code?: number | string
  info?: string
  message?: string
  data?: {
    ekyc_status?: VerificationStatus
    ekycStatus?: VerificationStatus
    kyc_status?: VerificationStatus
    [key: string]: unknown
  }
  ekycStatus?: VerificationStatus
  ekyc_status?: VerificationStatus
  kyc_status?: VerificationStatus
}

export async function postAadhaarVerifyOtp(
  ctx: OnboardingFarmerContext,
  body: AadhaarVerifyOtpBody,
): Promise<AadhaarVerifyOtpResponse> {
  return postJsonAuth(getApiUrl('kycAadhaarVerify'), {
    farmer_id: ctx.farmerApiId,
    reference_id: body.referenceId,
    otp: body.otp,
  })
}

export type KycStatusUpdateBody = {
  kycStatus: VerificationStatus | string
}

export type KycStatusUpdateResponse = {
  success?: boolean
  kyc_status?: string
  ekyc_status?: string
}

/** Called after Aadhaar OTP verify succeeds (backend contract). */
export async function postKycStatusUpdate(
  ctx: OnboardingFarmerContext,
  body: KycStatusUpdateBody,
): Promise<KycStatusUpdateResponse> {
  return postJsonAuth(getApiUrl('kycStatusUpdate'), {
    farmer_id: ctx.farmerApiId,
    kyc_status: body.kycStatus,
  })
}

export type FarmerVerificationStatusResponse = {
  code?: number
  data?: {
    ekyc_status?: string
    ekycStatus?: string
    bav_status?: string
    bavStatus?: string
    kyc_status?: string
    kycStatus?: string
    identity_confirmed?: boolean
    identityConfirmed?: boolean
    masked_aadhaar?: string
    maskedAadhaar?: string
    ekyc_rejection_reason?: string
    bav_rejection_reason?: string
    national_id_document_verification_status?: string
    national_id_document_status?: string
    bank_account_verification_status?: string
    bank_account_document_verification_status?: string
    passbook_verification_status?: string
    [key: string]: unknown
  }
  ekyc_status?: string
  ekycStatus?: string
  bav_status?: string
  bavStatus?: string
  kyc_status?: string
  kycStatus?: string
  identity_confirmed?: boolean
  identityConfirmed?: boolean
  masked_aadhaar?: string
  maskedAadhaar?: string
  ekyc_rejection_reason?: string
  bav_rejection_reason?: string
  national_id_document_verification_status?: string
  national_id_document_status?: string
  bank_account_verification_status?: string
  bank_account_document_verification_status?: string
  passbook_verification_status?: string
}

export async function postFarmerVerificationStatus(
  ctx: OnboardingFarmerContext,
): Promise<FarmerVerificationStatusResponse> {
  return postJsonAuth(getApiUrl('farmerVerificationStatus'), {
    farmer_id: ctx.farmerApiId,
  })
}

export type BankVerificationBody = {
  bankAccountNumber: string
  ifscCode: string
}

export type BankVerificationResponse = {
  success?: boolean
  code?: number
  data?: {
    bav_status?: VerificationStatus
    bavStatus?: VerificationStatus
    matches_registered_account?: boolean
    matchesRegisteredAccount?: boolean
    [key: string]: unknown
  }
  bavStatus?: VerificationStatus
  bav_status?: VerificationStatus
  matchesRegisteredAccount?: boolean
  matches_registered_account?: boolean
}

export async function postBankVerification(
  ctx: OnboardingFarmerContext,
  body: BankVerificationBody,
): Promise<BankVerificationResponse> {
  return postJsonAuth(getApiUrl('bankVerification'), {
    farmer_id: ctx.farmerApiId,
    ifsc: body.ifscCode.trim().toUpperCase(),
    account_number: body.bankAccountNumber.replace(/\D/g, ''),
  })
}
