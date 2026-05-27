'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Check, UserCheck } from 'lucide-react'
import { useBootstrap } from '../../bootstrap/BootstrapProvider'
import { OnboardingStepLayout } from '../../components/onboarding/OnboardingStepLayout'
import { readOnboardingAadhaar, saveOnboardingAadhaar } from '../../utils/onboardingDraft'
import { displayMaskedAadhaar } from '../../utils/onboardingResolve'
import { hasAadhaarOnRecord } from '../../utils/onboardingPrerequisites'

function normalizeAadhaarInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12)
}

export default function EkycIntroScreen() {
  const { t } = useTranslation()
  const { bootstrap } = useBootstrap()
  const router = useRouter()
  const fromProfile = bootstrap ? hasAadhaarOnRecord(bootstrap) : false
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (fromProfile) return
    const saved = readOnboardingAadhaar()
    if (saved) setAadhaarInput(saved)
  }, [fromProfile])

  const digits = normalizeAadhaarInput(aadhaarInput)
  const canProceed = bootstrap
    ? fromProfile || digits.length === 12
    : digits.length === 12

  const handleProceed = () => {
    setError(null)
    if (fromProfile) {
      router.push('/onboarding/ekyc-otp/')
      return
    }
    if (digits.length !== 12) {
      setError(t('aadhaar_invalid'))
      return
    }
    saveOnboardingAadhaar(digits)
    router.push('/onboarding/ekyc-otp/')
  }

  return (
    <OnboardingStepLayout
      backHref="/"
      footer={
        fromProfile ? (
          <Link href="/onboarding/ekyc-otp/" className="fp-btn fp-btn--primary fp-btn--lg">
            {t('proceed_aadhaar')}
          </Link>
        ) : (
          <button
            type="button"
            className="fp-btn fp-btn--primary fp-btn--lg"
            disabled={!canProceed}
            onClick={handleProceed}
          >
            {t('proceed_aadhaar')}
          </button>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--fp-space-3)' }}>
        <span className="fp-tile-icon fp-tile-icon--brand fp-tile-icon--lg" aria-hidden>
          <UserCheck size={28} />
        </span>
        <h1 className="fp-onboarding__title">{t('kyc_intro_title')}</h1>
        <p className="fp-onboarding__lead">{t('kyc_intro_desc')}</p>
      </div>

      {!fromProfile ? (
        <div className="fp-form-field" style={{ marginTop: 'var(--fp-space-4)' }}>
          <label className="fp-label" htmlFor="aadhaar-entry">
            {t('enter_aadhaar_number')}
          </label>
          <input
            id="aadhaar-entry"
            className="fp-input fp-input--mono"
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            placeholder="1234 5678 9012"
            value={aadhaarInput}
            aria-invalid={error ? 'true' : 'false'}
            onChange={(e) => {
              setAadhaarInput(normalizeAadhaarInput(e.target.value))
              setError(null)
            }}
          />
          <p className="fp-help">{t('aadhaar_enter_hint')}</p>
          {error ? <p className="fp-error">{error}</p> : null}
        </div>
      ) : (
        <div className="fp-form-field" style={{ marginTop: 'var(--fp-space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--fp-space-1)' }}>
            <span className="fp-label" style={{ marginBottom: 0 }}>{t('enter_aadhaar_number')}</span>
            <span className="fp-status fp-status--accepted" style={{ fontSize: '0.7rem' }}>
              <span className="fp-status__dot" aria-hidden><Check size={11} strokeWidth={3} /></span>
              {t('auto_filled')}
            </span>
          </div>
          <input
            className="fp-input fp-input--mono fp-input--readonly"
            readOnly
            tabIndex={-1}
            value={displayMaskedAadhaar(bootstrap)}
          />
          <p className="fp-help">{t('aadhaar_on_file_hint')}</p>
        </div>
      )}

      <div className="fp-benefit-list">
        <div className="fp-benefit-tile">
          <span className="fp-benefit-tile__icon">
            <Check size={14} strokeWidth={3} />
          </span>
          <p className="fp-benefit-tile__text">{t('kyc_benefit_legal')}</p>
        </div>
        <div className="fp-benefit-tile">
          <span className="fp-benefit-tile__icon">
            <Check size={14} strokeWidth={3} />
          </span>
          <p className="fp-benefit-tile__text">{t('kyc_benefit_payout')}</p>
        </div>
      </div>
    </OnboardingStepLayout>
  )
}
