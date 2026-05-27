'use client'

import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { OnboardingStepLayout } from '../../components/onboarding/OnboardingStepLayout'
import { Toast } from '../../components/ui/Toast'
import { useBootstrap } from '../../bootstrap/BootstrapProvider'
import {
  extractReferenceId,
  postAadhaarConsentOtp,
  postAadhaarVerifyOtp,
  postKycStatusUpdate,
  type AadhaarConsentOtpResponse,
} from '../../services/onboardingApi'
import { onboardingContextFromBootstrap } from '../../services/bootstrapService'
import { clearOnboardingAadhaar } from '../../utils/onboardingDraft'
import {
  canProceedToEkycOtp,
  displayMaskedAadhaar,
  resolveAadhaarForEkyc,
} from '../../utils/onboardingResolve'
import { ApiError } from '../../services/http/ApiError'
import { extractMaskedAadhaar } from '../../utils/bootstrapMapping'
import {
  emptyOtpDigits,
  isOtpComplete,
  lastDigitFromInput,
  mergePastedOtp,
  OTP_LENGTH,
  parseOtpPaste,
} from '../../utils/otp'

const OTP_SEND_TIMEOUT_MS = 30_000

function maskedFromOtpResponse(res: AadhaarConsentOtpResponse): string | null {
  return extractMaskedAadhaar(res as Record<string, unknown>)
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

export default function EkycOtpScreen() {
  const { t } = useTranslation()
  const { bootstrap, refresh } = useBootstrap()
  const router = useRouter()
  const [segments, setSegments] = useState<string[]>(() => emptyOtpDigits())
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [referenceId, setReferenceId] = useState<string | null>(null)
  const [displayMasked, setDisplayMasked] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    tone: 'success' | 'danger'
    message: string
  } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  // Tracks whether the auto-send has already fired so it only happens once.
  const autoSendAttempted = useRef(false)
  // Ref-based in-flight guard so flipping it doesn't recreate sendOtp or
  // re-trigger the auto-send effect.
  const sendingOtpRef = useRef(false)
  // Set to true once OTP verify succeeds and we call router.replace(bav-intro).
  // Prevents the canProceedToEkycOtp guard from racing with navigation and
  // firing a redirect back to ekyc-intro after clearOnboardingAadhaar() runs.
  const verifiedRef = useRef(false)

  const otp = segments.join('')
  const aadhaarPayload = resolveAadhaarForEkyc(bootstrap)
  const profileReady = Boolean(bootstrap?.farmerApiId)
  const masked =
    displayMasked?.trim() ||
    displayMaskedAadhaar(bootstrap, aadhaarPayload)

  useEffect(() => {
    if (!bootstrap) return
    if (submitting) return
    if (verifiedRef.current) return
    if (!canProceedToEkycOtp(bootstrap)) {
      router.replace('/onboarding/ekyc-intro/')
    }
  }, [bootstrap, router, submitting])

  // sendOtp deps: aadhaarPayload, bootstrap, t — NOT sendingOtp state.
  // We use sendingOtpRef for the in-flight guard to avoid the dep-change
  // cycle that caused an infinite retry loop when the API failed.
  const sendOtp = useCallback(async () => {
    if (!bootstrap?.farmerApiId || !aadhaarPayload || sendingOtpRef.current) return

    sendingOtpRef.current = true
    setSendingOtp(true)
    setToast(null)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), OTP_SEND_TIMEOUT_MS)

    try {
      const ctx = onboardingContextFromBootstrap(bootstrap)
      const res = await postAadhaarConsentOtp(
        ctx,
        { aadhaarNumber: aadhaarPayload, consent: 'y' },
        { signal: controller.signal },
      )
      const rid = extractReferenceId(res)
      if (!rid) {
        // reference_id: 0 means UIDAI rate-limited (45-second cooldown between requests)
        const refId = res.data?.reference_id
        const msg =
          (refId === 0 || refId === '0') && typeof res.data?.message === 'string' && res.data.message.trim()
            ? res.data.message.trim()
            : refId === 0 || refId === '0'
              ? t('otp_rate_limited')
              : t('otp_reference_missing')
        setToast({ tone: 'danger', message: msg })
        return
      }
      setReferenceId(rid)
      const fromApi = maskedFromOtpResponse(res)
      if (fromApi) setDisplayMasked(fromApi)
      else setDisplayMasked(displayMaskedAadhaar(bootstrap, aadhaarPayload))
      setOtpSent(true)
    } catch (e) {
      // Do NOT reset autoSendAttempted here — auto-send fires once per mount.
      // The manual "Send OTP" button below is the retry path.
      if (isAbortError(e)) {
        setToast({ tone: 'danger', message: t('otp_send_timeout') })
      } else {
        setToast({
          tone: 'danger',
          message: e instanceof ApiError ? e.message : t('error_generic'),
        })
      }
    } finally {
      window.clearTimeout(timeoutId)
      sendingOtpRef.current = false
      setSendingOtp(false)
    }
  }, [aadhaarPayload, bootstrap, t])

  // Auto-send once when the profile is ready and an Aadhaar payload is
  // available. sendOtp is stable (no sendingOtp in its deps) so this
  // effect only re-runs when the data it depends on genuinely changes.
  useEffect(() => {
    if (!profileReady || !aadhaarPayload || otpSent || autoSendAttempted.current) return
    autoSendAttempted.current = true
    void sendOtp()
  }, [profileReady, aadhaarPayload, otpSent, sendOtp])

  // Focus the first OTP digit box as soon as the OTP has been sent.
  // autoFocus on the <input> only fires at mount — we need this explicit effect
  // because the input is disabled (and therefore un-focusable) until otpSent.
  useEffect(() => {
    if (otpSent) {
      requestAnimationFrame(() => inputRefs.current[0]?.focus())
    }
  }, [otpSent])

  const setDigit = (index: number, rawValue: string) => {
    if (submitting) return
    const digit = lastDigitFromInput(rawValue)
    setSegments((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (submitting) return
    if (e.key === 'Backspace' && !segments[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (submitting) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    const pasted = parseOtpPaste(e.clipboardData.getData('text'))
    if (!pasted) return
    setSegments((prev) => mergePastedOtp(prev, pasted))
    const last = Math.min(pasted.length, OTP_LENGTH - 1)
    queueMicrotask(() => inputRefs.current[last]?.focus())
  }

  const onSubmit = async () => {
    if (otp.length !== OTP_LENGTH || !consent || submitting || !aadhaarPayload) return
    if (!referenceId) {
      setToast({ tone: 'danger', message: t('otp_send_first') })
      return
    }
    if (!bootstrap) return
    setSubmitting(true)
    const ctx = onboardingContextFromBootstrap(bootstrap)
    try {
      await postAadhaarVerifyOtp(ctx, { referenceId, otp })
      // Persist the status change on the backend (best-effort).
      try {
        await postKycStatusUpdate(ctx, { kycStatus: 'IN_PROGRESS' })
      } catch (statusErr) {
        console.warn('[ekyc] kyc-status/update failed (backend may be unavailable):', statusErr)
      }
      clearOnboardingAadhaar()
      await refresh()
      // Lock the redirect guard before navigating — setSubmitting(false) in
      // finally fires synchronously after this line and would otherwise race.
      verifiedRef.current = true
      router.replace('/onboarding/ekyc-success/')
    } catch (e) {
      setToast({
        tone: 'danger',
        message: e instanceof ApiError ? e.message : t('error_generic'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const subline = !profileReady
    ? t('profile_loading')
    : sendingOtp
      ? t('otp_sending')
      : otpSent
        ? null
        : t('otp_tap_send')

  return (
    <OnboardingStepLayout
      backHref="/onboarding/ekyc-intro/"
      footer={
        <button
          type="button"
          className="fp-btn fp-btn--primary fp-btn--lg"
          disabled={
            !isOtpComplete(segments) ||
            !consent ||
            submitting ||
            sendingOtp ||
            !otpSent ||
            !referenceId
          }
          onClick={() => void onSubmit()}
        >
          {submitting ? t('loading') : t('confirm_verify')}
        </button>
      }
    >
      {toast ? (
        <Toast
          tone={toast.tone}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <header className="fp-ekyc-header">
        <h1 className="fp-ekyc-header__title">{t('verify_identity')}</h1>
        <p className="fp-ekyc-header__sub">
          {sendingOtp ? (
            t('otp_sending')
          ) : otpSent ? (
            <>
              {t('aadhaar_otp_sent')}{' '}
              <span className="fp-ekyc-header__masked">{masked}</span>
            </>
          ) : profileReady ? (
            subline
          ) : (
            t('profile_loading')
          )}
        </p>
      </header>

      {!otpSent && profileReady && aadhaarPayload ? (
        <button
          type="button"
          className="fp-btn fp-btn--primary-soft fp-btn--lg"
          disabled={sendingOtp}
          onClick={() => void sendOtp()}
          style={{ marginBottom: 'var(--fp-space-4)' }}
        >
          {sendingOtp ? t('otp_sending') : t('send_otp')}
        </button>
      ) : null}

      <label className="fp-checkbox">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={sendingOtp || submitting}
        />
        <span>{t('aadhaar_consent')}</span>
      </label>

      <div className="fp-otp-grid" onPaste={onPaste}>
        {segments.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            className="fp-otp-segment"
            inputMode="numeric"
            maxLength={1}
            aria-label={`${t('enter_otp')} ${i + 1}`}
            value={d}
            disabled={submitting || sendingOtp || !otpSent}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            autoFocus={i === 0 && otpSent}
          />
        ))}
      </div>

      {otpSent && referenceId && isOtpComplete(segments) && !consent ? (
        <p className="fp-help" style={{ textAlign: 'center', marginTop: 'var(--fp-space-2)', color: 'var(--fp-color-warning, #d97706)' }}>
          {t('consent_required_hint')}
        </p>
      ) : null}
    </OnboardingStepLayout>
  )
}
