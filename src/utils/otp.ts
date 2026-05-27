import { digitsOnly } from './phone'

export const OTP_LENGTH = 6

export function emptyOtpDigits(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => '')
}

export function parseOtpPaste(text: string): string {
  return digitsOnly(text).slice(0, OTP_LENGTH)
}

export function mergePastedOtp(current: string[], pasted: string): string[] {
  const next = [...current]
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    next[i] = pasted[i] ?? ''
  }
  return next
}

export function lastDigitFromInput(value: string): string {
  return digitsOnly(value).slice(-1)
}

export function isOtpComplete(segments: string[]): boolean {
  return segments.join('').length === OTP_LENGTH
}
