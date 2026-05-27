import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { DEFAULT_COUNTRY_CODE } from '../constants/defaultCountry'
import * as authApi from '../services/authApi'
import { ApiError } from '../services/http/ApiError'
import { digitsOnly, formatMaskedPhoneForDisplay, isValidPhoneNumber } from '../utils/phone'
import { OTP_LENGTH } from '../utils/otp'

export type LoginStep = 'phone' | 'otp'

/** Cooldown before "Resend OTP" is allowed again (not applied to entering or verifying OTP). */
const RESEND_COOLDOWN_MS = 30_000

function setErrorFromUnknown(setError: (m: string) => void, err: unknown) {
  if (err instanceof ApiError) {
    setError(err.message)
    return
  }
  setError('Something went wrong. Please try again.')
}

export function useLoginFlow(onSessionCreated: () => void) {
  const { completeLogin } = useAuth()

  const [step, setStep] = useState<LoginStep>('phone')
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [phoneDigits, setPhoneDigits] = useState('')
  const [lastPhoneRaw, setLastPhoneRaw] = useState('')
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(() => Date.now())

  const [phoneSubmitting, setPhoneSubmitting] = useState(false)
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const [resendSubmitting, setResendSubmitting] = useState(false)

  const maskedPhone = formatMaskedPhoneForDisplay(DEFAULT_COUNTRY_CODE, phoneDigits)

  useEffect(() => {
    if (step !== 'otp' || !resendAvailableAt) return undefined
    if (Date.now() >= resendAvailableAt) return undefined
    const id = window.setInterval(() => setNowTick(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [step, resendAvailableAt])

  const resendCooldownSecondsRemaining =
    step === 'otp' && resendAvailableAt
      ? Math.max(0, Math.ceil((resendAvailableAt - nowTick) / 1000))
      : 0

  const clearFeedback = useCallback(() => {
    setError(null)
    setInfoMessage(null)
  }, [])

  const goToPhoneStep = useCallback(() => {
    setStep('phone')
    setTransactionId(null)
    setResendAvailableAt(null)
    setPhoneDigits('')
    clearFeedback()
  }, [clearFeedback])

  const submitPhone = useCallback(
    async (phoneRaw: string) => {
      if (!isValidPhoneNumber(phoneRaw)) {
        setError('Please enter a valid phone number')
        return
      }

      setPhoneSubmitting(true)
      clearFeedback()

      try {
        const mobile = digitsOnly(phoneRaw)
        const { transaction_id } = await authApi.requestLoginOtp({ mobile_number: mobile })
        setLastPhoneRaw(phoneRaw.trim())
        setPhoneDigits(mobile)
        setTransactionId(transaction_id)
        setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS)
        setInfoMessage('OTP sent to your registered mobile number.')
        setStep('otp')
      } catch (err) {
        setErrorFromUnknown(setError, err)
      } finally {
        setPhoneSubmitting(false)
      }
    },
    [clearFeedback],
  )

  const submitResendOtp = useCallback(async () => {
    if (!transactionId) return

    setResendSubmitting(true)
    setInfoMessage(null)
    setError(null)

    try {
      const { transaction_id } = await authApi.requestResendLoginOtp({ transaction_id: transactionId })
      setTransactionId(transaction_id)
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS)
      setInfoMessage('A new verification code was sent.')
    } catch (err) {
      setErrorFromUnknown(setError, err)
    } finally {
      setResendSubmitting(false)
    }
  }, [transactionId])

  const submitOtpCode = useCallback(
    async (code: string) => {
      if (!transactionId) {
        setError('Session expired. Please enter your phone number again.')
        return
      }
      if (code.length !== OTP_LENGTH) {
        setError('Please enter a valid 6-digit OTP.')
        return
      }

      setOtpSubmitting(true)
      setError(null)
      setInfoMessage(null)

      try {
        const body = await authApi.requestValidateLoginOtp({
          transaction_id: transactionId,
          otp: code,
        })
        if (!body?.token?.access_token) {
          setError('Unexpected server response. Please try again.')
          return
        }
        completeLogin(body)
        // Defer navigation to the next task so AuthProvider state commits before /farm runs RequireAuth.
        setTimeout(() => {
          onSessionCreated()
        }, 0)
      } catch (err) {
        setErrorFromUnknown(setError, err)
      } finally {
        setOtpSubmitting(false)
      }
    },
    [completeLogin, onSessionCreated, transactionId],
  )

  return {
    step,
    error,
    infoMessage,
    maskedPhone,
    lastPhoneRaw,
    transactionId,
    resendCooldownSecondsRemaining,
    phoneSubmitting,
    otpSubmitting,
    resendSubmitting,
    submitPhone,
    submitOtpCode,
    submitResendOtp,
    goToPhoneStep,
    clearFeedback,
  }
}
