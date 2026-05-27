const AADHAAR_KEY = 'fp_onboarding_aadhaar_v1'
const BANK_KEY = 'fp_onboarding_bank_v1'

export type OnboardingBankDraft = {
  accountNumber: string
  ifscCode: string
}

function canUseSession(): boolean {
  return typeof sessionStorage !== 'undefined'
}

export function saveOnboardingAadhaar(digits: string): void {
  if (!canUseSession()) return
  sessionStorage.setItem(AADHAAR_KEY, digits.replace(/\D/g, '').slice(0, 12))
}

export function readOnboardingAadhaar(): string | null {
  if (!canUseSession()) return null
  const digits = sessionStorage.getItem(AADHAAR_KEY)?.replace(/\D/g, '') ?? ''
  return digits.length === 12 ? digits : null
}

export function clearOnboardingAadhaar(): void {
  if (!canUseSession()) return
  sessionStorage.removeItem(AADHAAR_KEY)
}

export function saveOnboardingBank(draft: OnboardingBankDraft): void {
  if (!canUseSession()) return
  sessionStorage.setItem(
    BANK_KEY,
    JSON.stringify({
      accountNumber: draft.accountNumber.replace(/\D/g, ''),
      ifscCode: draft.ifscCode.trim().toUpperCase(),
    }),
  )
}

export function readOnboardingBank(): OnboardingBankDraft | null {
  if (!canUseSession()) return null
  try {
    const raw = sessionStorage.getItem(BANK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OnboardingBankDraft
    const accountNumber = parsed.accountNumber?.replace(/\D/g, '') ?? ''
    const ifscCode = parsed.ifscCode?.trim().toUpperCase() ?? ''
    if (accountNumber.length < 6 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) return null
    return { accountNumber, ifscCode }
  } catch {
    return null
  }
}

export function clearOnboardingBank(): void {
  if (!canUseSession()) return
  sessionStorage.removeItem(BANK_KEY)
}
