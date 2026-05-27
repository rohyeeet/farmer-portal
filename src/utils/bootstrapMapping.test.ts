import { describe, expect, it } from 'vitest'
import { mapFarmerToBootstrap } from './bootstrapMapping'
import type { FarmerProfileResponse } from '../types/farmer.api'

const baseProfile: FarmerProfileResponse = {
  id: 42,
  first_name: 'Test',
  last_name: 'Farmer',
  mobile_number: '+919876543210',
  gender: null,
  gaurdian_name: null,
  fsm_state: null,
  farmer_address: {
    village: 'V',
    ward_number: null,
    pincode: null,
    block_name: 'Block',
    district_name: 'District',
    state_name: 'State',
    country_name: 'India',
  },
  farmer_profile_picture: null,
  surveyor_name: null,
  tenant_name: null,
  tags: null,
}

describe('mapFarmerToBootstrap', () => {
  it('maps kyc_status true to ACCEPTED', () => {
    const b = mapFarmerToBootstrap({ ...baseProfile, kyc_status: true, farmer_consent: true }, 3, 'en')
    expect(b.ekycStatus).toBe('ACCEPTED')
    expect(b.identityConfirmed).toBe(true)
    expect(b.farmsSummary.count).toBe(3)
  })

  it('maps kyc_status false to MISSING (not rejected)', () => {
    const b = mapFarmerToBootstrap({ ...baseProfile, kyc_status: false }, 0, 'en')
    expect(b.ekycStatus).toBe('MISSING')
  })

  it('defaults bav to MISSING', () => {
    const b = mapFarmerToBootstrap(baseProfile, 1, 'en')
    expect(b.bavStatus).toBe('MISSING')
  })
})
