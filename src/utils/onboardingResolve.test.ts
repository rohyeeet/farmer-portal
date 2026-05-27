import { describe, expect, it, beforeEach } from 'vitest'
import type { FarmerBootstrap } from '../types/bootstrap.api'
import {
  canProceedToEkycOtp,
  resolveAadhaarForEkyc,
} from './onboardingResolve'
import { saveOnboardingAadhaar, clearOnboardingAadhaar } from './onboardingDraft'

const baseBootstrap = {
  farmerId: 1,
  farmerApiId: '1',
  aadhaarNumber: null,
  preferredLanguage: 'en' as const,
  identityConfirmed: false,
  ekycStatus: 'MISSING' as const,
  nationalIdDocumentStatus: 'MISSING' as const,
  bavStatus: 'MISSING' as const,
  bankAccountDocumentStatus: 'MISSING' as const,
  ekycRejectionReason: null,
  bavRejectionReason: null,
  maskedAadhaar: null,
  maskedBankAccountNumber: null,
  registeredBankAccountNumber: null,
  bankIfscCode: null,
  bankName: null,
  farmerProfile: {
    name: 'Test',
    profilePhotoUrl: null,
    mobileNumber: '9',
    region: { state: '—', district: '—', block: '—' },
  },
  farmsSummary: { count: 0 },
} satisfies FarmerBootstrap

describe('onboardingResolve', () => {
  beforeEach(() => {
    clearOnboardingAadhaar()
  })

  it('uses profile aadhaar when present', () => {
    const b = { ...baseBootstrap, aadhaarNumber: '123456789012' }
    expect(resolveAadhaarForEkyc(b)).toBe('123456789012')
  })

  it('falls back to session draft', () => {
    saveOnboardingAadhaar('987654321098')
    expect(resolveAadhaarForEkyc(baseBootstrap)).toBe('987654321098')
    expect(canProceedToEkycOtp(baseBootstrap)).toBe(true)
  })
})
