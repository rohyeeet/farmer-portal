import { getApiUrl } from '../config/apiRegistry'
import type { FarmerProfileResponse } from '../types/farmer.api'
import { getJsonAuth } from './http/getJsonAuth'
import { normalizeFarmerProfilePayload } from '../utils/farmerProfileNormalize'

export async function fetchFarmerProfile(): Promise<FarmerProfileResponse> {
  const raw = await getJsonAuth<unknown>(getApiUrl('farmerProfile'))
  const profile = normalizeFarmerProfilePayload(raw)
  if (!profile) {
    throw new Error('Farmer profile response was empty or unrecognized.')
  }
  return profile
}
