import type { FarmerAddress, FarmerProfileResponse } from '../types/farmer.api'

export function farmerDisplayName(f: FarmerProfileResponse): string {
  const first = f.first_name?.trim() ?? ''
  const last = f.last_name?.trim() ?? ''
  const full = `${first} ${last}`.trim()
  return full || 'Farmer'
}

export function farmerInitials(f: FarmerProfileResponse): string {
  const first = f.first_name?.trim()?.[0] ?? ''
  const last = f.last_name?.trim()?.[0] ?? ''
  const s = `${first}${last}`.toUpperCase()
  return s || 'F'
}

export function formatAddressLines(addr: FarmerAddress | null): string[] {
  if (!addr) return []
  const line1 = [addr.village, addr.block_name].filter(Boolean).join(', ')
  const line2 = [addr.district_name, addr.state_name].filter(Boolean).join(', ')
  const line3 = [addr.country_name, addr.pincode].filter(Boolean).join(' · ')
  return [line1, line2, line3].filter((l) => l.length > 0)
}

const ADDRESS_FIELD_ORDER: { key: keyof FarmerAddress; label: string }[] = [
  { key: 'country_name', label: 'Country' },
  { key: 'state_name', label: 'State' },
  { key: 'district_name', label: 'District' },
  { key: 'block_name', label: 'Block' },
  { key: 'village', label: 'Village' },
  { key: 'pincode', label: 'Pincode' },
]

/** Label + value rows for the profile address card (empty fields show as —). */
export function farmerAddressLabeledRows(addr: FarmerAddress | null): { label: string; value: string }[] {
  return ADDRESS_FIELD_ORDER.map(({ key, label }) => {
    if (!addr) return { label, value: '—' }
    const raw = addr[key]
    const s = raw == null ? '' : String(raw).trim()
    return { label, value: s.length > 0 ? s : '—' }
  })
}

/** Picks first creation datetime field present on the payload. */
export function farmerCreatedRaw(f: FarmerProfileResponse): string | number | null {
  const v = f.created_at ?? f.created ?? f.created_datetime ?? f.date_joined
  if (v == null) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

/** Renders creation time as a calendar date (human-readable, not a raw unix value). */
export function formatFarmerCreatedDate(raw: string | number | null): string {
  if (raw == null) return '—'
  let d: Date
  if (typeof raw === 'number') {
    d = new Date(raw < 1e12 ? raw * 1000 : raw)
  } else {
    d = new Date(raw)
  }
  if (Number.isNaN(d.getTime())) return typeof raw === 'string' ? raw : '—'
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function profileImageUrl(f: FarmerProfileResponse): string | null {
  const pic = f.farmer_profile_picture
  if (!pic) return null
  return pic.thumbnail_url?.trim() || pic.media_url?.trim() || null
}
