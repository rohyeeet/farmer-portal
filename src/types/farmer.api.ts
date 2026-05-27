/** GET /api/mobile/v2/farmer/ */
export type FarmerAddress = {
  village: string | null
  ward_number: string | null
  pincode: string | null
  block_name: string | null
  district_name: string | null
  state_name: string | null
  country_name: string | null
}

export type FarmerProfilePicture = {
  id: number
  media_url: string | null
  thumbnail_url: string | null
  content_type: string | null
  verification_status?: string | null
} | null

export type FarmerProfileResponse = {
  id: number
  /** String identifier the KYC/BAV/verification APIs expect as `farmer_id`. */
  farmer_id?: string | number | null
  first_name: string | null
  last_name: string | null
  mobile_number: string | null
  gender: string | null
  gaurdian_name: string | null
  fsm_state: string | null
  farmer_address: FarmerAddress | null
  farmer_profile_picture: FarmerProfilePicture
  surveyor_name: string | null
  tenant_name: string | null
  tags: string[] | null
  kyc_status?: boolean | null
  farmer_consent?: boolean | null
  date_of_birth?: string | null
  geo_tag?: { type: string; coordinates: number[] } | null
  /** Account / record creation time from API (ISO string, epoch seconds/ms, etc.). */
  created_at?: string | number | null
  created?: string | number | null
  created_datetime?: string | number | null
  date_joined?: string | number | null
}
