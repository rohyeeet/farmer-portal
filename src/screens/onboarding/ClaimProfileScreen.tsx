'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { CreditCard, MapPin, ShieldCheck } from 'lucide-react'
import { useBootstrap } from '../../bootstrap/BootstrapProvider'
import { OnboardingStepLayout } from '../../components/onboarding/OnboardingStepLayout'
import { BrandMark } from '../../components/brand/BrandMark'
import { PageLoading } from '../../components/ui/PageLoading'
import { Toast } from '../../components/ui/Toast'
import {
  WrongDetailsDialog,
  type WrongDetailsReason,
} from '../../components/onboarding/WrongDetailsDialog'
import { useDynamicTranslation } from '../../i18n/useDynamicTranslation'
import { getPostClaimNextPath } from '../../types/verification.types'
import { ApiError } from '../../services/http/ApiError'

const REPORTED_ISSUE_KEY = 'fp_profile_reported_issue_v1'

export default function ClaimProfileScreen() {
  const { t } = useTranslation()
  const { bootstrap, refresh } = useBootstrap()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Hooks must run before any conditional `return`. Compute even when
  // bootstrap is still null (the dynamic translation hook handles empty
  // input gracefully and returns ''.)
  const farmerProfile = bootstrap?.farmerProfile
  const regionBlock = farmerProfile?.region.block ?? ''
  const regionDistrict = farmerProfile?.region.district ?? ''
  const regionState = farmerProfile?.region.state ?? ''
  const translatedBlock = useDynamicTranslation(regionBlock)
  const translatedDistrict = useDynamicTranslation(regionDistrict)
  const translatedState = useDynamicTranslation(regionState)

  if (!bootstrap || !farmerProfile) {
    return <PageLoading />
  }

  const { maskedAadhaar } = bootstrap
  const regionLine = [translatedBlock, translatedDistrict, translatedState]
    .filter((s) => s && s !== '—')
    .join(', ') || '—'

  // No dedicated identity-confirmation API in the slim contract — the
  // farmer's confirmation is implicit when they proceed to KYC. We still
  // refresh bootstrap (cheap; no-op if nothing changed) before routing
  // so any concurrent backend update is picked up immediately.
  const advance = async (_confirmed: boolean) => {
    await refresh()
    const next = getPostClaimNextPath(bootstrap.ekycStatus, bootstrap.bavStatus)
    router.replace(next)
  }

  const onConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await advance(true)
    } catch (e) {
      setToast({ tone: 'danger', message: e instanceof ApiError ? e.message : t('error_generic') })
    } finally {
      setSubmitting(false)
    }
  }

  const onIssueSubmit = async (reason: WrongDetailsReason) => {
    setDialogOpen(false)
    if (submitting) return
    setSubmitting(true)
    try {
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(
            REPORTED_ISSUE_KEY,
            JSON.stringify({ reason, at: Date.now() }),
          )
        } catch {
          /* ignore quota */
        }
      }
      setToast({ tone: 'success', message: t('wrong_details_acknowledged') })
      await advance(false)
    } catch (e) {
      setToast({ tone: 'danger', message: e instanceof ApiError ? e.message : t('error_generic') })
    } finally {
      setSubmitting(false)
    }
  }

  const initial = (farmerProfile.name?.trim()?.[0] ?? 'F').toUpperCase()

  return (
    <OnboardingStepLayout
      hero={
        <>
          <span className="fp-brand-mark" aria-hidden>
            <BrandMark size={18} />
          </span>
          <p className="fp-onboarding__card-hero-title">{t('claim_profile_eyebrow')}</p>
          <p className="fp-onboarding__card-hero-sub">{t('claim_profile_desc')}</p>
        </>
      }
      footer={
        <>
          <button
            type="button"
            className="fp-btn fp-btn--primary fp-btn--lg"
            onClick={() => void onConfirm()}
            disabled={submitting}
          >
            {submitting ? t('loading') : t('yes_its_me')}
          </button>
          <button
            type="button"
            className="fp-btn fp-btn--ghost"
            onClick={() => setDialogOpen(true)}
            disabled={submitting}
          >
            {t('no_create_new')}
          </button>
          <p className="fp-onboarding__hint" style={{ textAlign: 'center', color: 'var(--fp-color-text-muted)', fontSize: 'var(--fp-text-xs)' }}>
            {t('wrong_details_help')}
          </p>
        </>
      }
    >
      {toast ? (
        <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />
      ) : null}

      <div className="fp-claim-avatar">
        {farmerProfile.profilePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={farmerProfile.profilePhotoUrl}
            alt=""
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{initial}</span>
        )}
        <span className="fp-claim-avatar__badge">
          <ShieldCheck size={12} strokeWidth={3} />
        </span>
      </div>

      <h2 className="fp-claim-name">{farmerProfile.name}</h2>
      <p className="fp-claim-phone">{farmerProfile.mobileNumber || '—'}</p>

      <div style={{ display: 'grid', gap: 'var(--fp-space-2)' }}>
        <div className="fp-field-tile">
          <span className="fp-field-tile__icon">
            <MapPin size={20} />
          </span>
          <div>
            <span className="fp-field-tile__label">{t('location')}</span>
            <span className="fp-field-tile__value">{regionLine}</span>
          </div>
        </div>
        {maskedAadhaar ? (
          <div className="fp-field-tile">
            <span className="fp-field-tile__icon">
              <CreditCard size={20} />
            </span>
            <div>
              <span className="fp-field-tile__label">{t('aadhaar_masked')}</span>
              <span
                className="fp-field-tile__value"
                style={{ letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums' }}
              >
                {maskedAadhaar}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <WrongDetailsDialog
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        onSubmit={(reason) => void onIssueSubmit(reason)}
      />
    </OnboardingStepLayout>
  )
}
