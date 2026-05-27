import { describe, expect, it } from 'vitest'
import { extractAadhaarNumber } from './farmerApiId'
import { normalizeFarmerProfilePayload } from './farmerProfileNormalize'

describe('extractAadhaarNumber', () => {
  it('accepts full 12-digit aadhaar_number', () => {
    expect(extractAadhaarNumber({ aadhaar_number: '289537985658' })).toBe('289537985658')
  })

  it('rejects masked aadhaar_number (only 4 digits)', () => {
    expect(extractAadhaarNumber({ aadhaar_number: 'XXXX XXXX 1234' })).toBeNull()
  })

  it('rejects masked_aadhaar only', () => {
    expect(extractAadhaarNumber({ masked_aadhaar: 'XXXX XXXX 5678' })).toBeNull()
  })

  it('accepts unmasked_aadhaar alias', () => {
    expect(extractAadhaarNumber({ unmasked_aadhaar: '2895 3798 5658' })).toBe('289537985658')
  })

  it('finds aadhaar inside nested kyc_details', () => {
    expect(
      extractAadhaarNumber({
        id: 1,
        first_name: 'R',
        kyc_details: { aadhaar_number: '123456789012' },
      }),
    ).toBe('123456789012')
  })

  it('finds aadhaar when profile is wrapped in data', () => {
    const profile = normalizeFarmerProfilePayload({
      data: { id: 2, first_name: 'X', aadhaar_number: '987654321098' },
    })
    expect(profile).not.toBeNull()
    expect(extractAadhaarNumber(profile as Record<string, unknown>)).toBe('987654321098')
  })
})
