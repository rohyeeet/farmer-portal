'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, CreditCard, Fingerprint, ShieldAlert } from 'lucide-react'
import type { FarmerBootstrap } from '../../types/bootstrap.api'
import type { VerificationStatus } from '../../types/verification.types'

type CardVariant = 'action' | 'progress' | 'accepted'

function getVariant(status: VerificationStatus): CardVariant {
  if (status === 'MISSING' || status === 'REJECTED') return 'action'
  if (status === 'IN_PROGRESS' || status === 'PENDING') return 'progress'
  return 'accepted'
}

const BANNER_CLS: Record<CardVariant, string> = {
  action: 'fp-banner fp-banner--alert',
  progress: 'fp-banner fp-banner--warn',
  accepted: 'fp-banner fp-banner--success',
}

const STATUS_ICON: Record<CardVariant, typeof CheckCircle2> = {
  action: ShieldAlert,
  progress: Clock,
  accepted: CheckCircle2,
}

function descKey(type: 'ekyc' | 'bav', status: VerificationStatus): string {
  if (status === 'ACCEPTED') return `${type}_card_accepted_text`
  if (status === 'REJECTED') return `${type}_card_rejected_text`
  if (status === 'IN_PROGRESS' || status === 'PENDING') {
    return type === 'ekyc' ? 'verification_in_progress_ekyc' : 'verification_in_progress_bav'
  }
  // MISSING
  return type === 'ekyc' ? 'verification_banner_ekyc_text' : 'verification_banner_bav_text'
}

function VerificationCard({
  type,
  status,
  ctaHref,
  ctaKey,
}: {
  type: 'ekyc' | 'bav'
  status: VerificationStatus
  ctaHref: string
  ctaKey: string
}) {
  const { t } = useTranslation()
  const variant = getVariant(status)
  const Icon = STATUS_ICON[variant]

  return (
    <aside className={BANNER_CLS[variant]} role="status" style={{ minWidth: '72vw', maxWidth: '20rem', flexShrink: 0, scrollSnapAlign: 'start' }}>
      <span className="fp-banner__icon" aria-hidden>
        {type === 'ekyc' ? <Fingerprint size={18} /> : <CreditCard size={18} />}
      </span>
      <div className="fp-banner__body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <p className="fp-banner__title">{t(`${type}_card_title`)}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', fontWeight: 700, opacity: 0.8, letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>
            <Icon size={11} />
            {t(variant === 'accepted' ? 'accepted' : variant === 'progress' ? 'in_progress' : status === 'REJECTED' ? 'rejected' : 'missing')}
          </span>
        </div>
        <p className="fp-banner__text">{t(descKey(type, status))}</p>
      </div>
      {variant === 'action' ? (
        <Link
          href={ctaHref}
          className="fp-btn fp-btn--on-brand fp-btn--sm fp-btn--inline fp-banner__cta"
        >
          {t(ctaKey)}
        </Link>
      ) : null}
    </aside>
  )
}

export function VerificationStatusCards({ bootstrap }: { bootstrap: FarmerBootstrap }) {
  const { ekycStatus, bavStatus } = bootstrap

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 'var(--fp-space-3)',
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: 'var(--fp-space-1)',
      // hide scrollbar visually while keeping scroll functional
      scrollbarWidth: 'none',
    }}>
      <VerificationCard
        type="ekyc"
        status={ekycStatus}
        ctaHref={ekycStatus !== 'ACCEPTED' ? '/onboarding/claim/' : '/'}
        ctaKey={ekycStatus === 'REJECTED' ? 'retry_verification' : 'verify_now'}
      />
      <VerificationCard
        type="bav"
        status={bavStatus}
        ctaHref="/onboarding/bav-intro/"
        ctaKey={bavStatus === 'REJECTED' ? 'retry_verification' : 'add_bank_account'}
      />
    </div>
  )
}
