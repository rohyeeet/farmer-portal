export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** Indian mobile: 10 digits starting with 6–9 (spec §6.2). */
export function isValidPhoneNumber(phone: string): boolean {
  const d = digitsOnly(phone)
  return /^[6-9]\d{9}$/.test(d)
}

export function formatMaskedPhoneForDisplay(countryCode: number, digits: string): string {
  if (digits.length <= 4) {
    return `+${countryCode} ${digits}`
  }
  return `+${countryCode} ${digits.slice(0, 2)}****${digits.slice(-2)}`
}
