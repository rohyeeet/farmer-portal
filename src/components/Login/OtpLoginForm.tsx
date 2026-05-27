'use client'

import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  emptyOtpDigits,
  isOtpComplete,
  lastDigitFromInput,
  mergePastedOtp,
  parseOtpPaste,
} from '../../utils/otp'

type OtpLoginFormProps = {
  error: string | null
  resendCooldownSecondsRemaining: number
  otpSubmitting: boolean
  resendSubmitting: boolean
  onBack: () => void
  onSubmitCode: (code: string) => void
  onResend: () => void
  onClearFeedback: () => void
}

export default function OtpLoginForm({
  error,
  resendCooldownSecondsRemaining,
  otpSubmitting,
  resendSubmitting,
  onBack,
  onSubmitCode,
  onResend,
  onClearFeedback,
}: OtpLoginFormProps) {
  const { t } = useTranslation()
  const [segments, setSegments] = useState<string[]>(() => emptyOtpDigits())
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const inputsDisabled = otpSubmitting
  const resendDisabled = resendCooldownSecondsRemaining > 0 || resendSubmitting

  const setDigit = (index: number, rawValue: string) => {
    if (inputsDisabled) return
    const digit = lastDigitFromInput(rawValue)
    setSegments((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    onClearFeedback()
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (inputsDisabled) return
    if (e.key === 'Backspace' && !segments[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (inputsDisabled) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    const pasted = parseOtpPaste(e.clipboardData.getData('text'))
    if (!pasted) return
    setSegments((prev) => mergePastedOtp(prev, pasted))
    onClearFeedback()
    const last = Math.min(pasted.length, 5)
    queueMicrotask(() => inputRefs.current[last]?.focus())
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (otpSubmitting) return
    void onSubmitCode(segments.join(''))
  }

  const handleResend = () => {
    if (resendDisabled) return
    setSegments(emptyOtpDigits())
    void onResend()
  }

  return (
    <form className="login-page__form" onSubmit={handleSubmit}>
      <div className="login-page__otp-wrap" onPaste={onPaste}>
        {segments.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            className="login-page__otp-segment"
            inputMode="numeric"
            maxLength={1}
            aria-label={`${t('enter_otp')} ${i + 1}`}
            value={d}
            disabled={inputsDisabled}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
          />
        ))}
      </div>

      {error ? (
        <div className="login-page__error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <button
        type="submit"
        className="fp-btn fp-btn--primary fp-btn--login-submit"
        disabled={!isOtpComplete(segments) || otpSubmitting}
      >
        {otpSubmitting ? t('loading') : t('verify_login')}
      </button>

      <p className="login-page__resend">
        {t('resend_otp')}{' '}
        <button type="button" className="fp-link" disabled={resendDisabled} onClick={handleResend}>
          {resendSubmitting ? t('loading') : t('resend_action')}
        </button>
      </p>

      {resendCooldownSecondsRemaining > 0 ? (
        <p className="login-page__resend-cooldown" role="status">
          {t('resend_in', { seconds: resendCooldownSecondsRemaining })}
        </p>
      ) : null}

      <p className="login-page__change-number">
        <button
          type="button"
          className="fp-link"
          disabled={otpSubmitting || resendSubmitting}
          onClick={onBack}
        >
          {t('back_to_mobile')}
        </button>
      </p>
    </form>
  )
}
