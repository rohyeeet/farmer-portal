import { describe, expect, it } from 'vitest'
import { normalizeFarmerProfilePayload } from './farmerProfileNormalize'
import { extractAadhaarNumber } from './farmerApiId'

describe('normalizeFarmerProfilePayload', () => {
  it('unwraps { data: farmer }', () => {
    const p = normalizeFarmerProfilePayload({
      data: { id: 9, first_name: 'A', aadhaar_number: '111122223333' },
    })
    expect(p?.id).toBe(9)
    expect(extractAadhaarNumber(p as Record<string, unknown>)).toBe('111122223333')
  })

  it('flattens kyc_details onto the profile record', () => {
    const p = normalizeFarmerProfilePayload({
      id: 3,
      kyc_details: { aadhaar_no: '444455556666' },
    })
    expect(extractAadhaarNumber(p as Record<string, unknown>)).toBe('444455556666')
  })
})
