'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Hourglass, ShieldAlert } from 'lucide-react'
import type { FarmerBootstrap } from '../../types/bootstrap.api'
import {
  getOnboardingNextPath,
  isFullyVerified,
  needsVerificationRemediation,
  type VerificationStatus,
} from '../../types/verification.types'

type BannerVariant = 'action' | 'progress' | 'success'

function pickRemediationCopy(
  ekyc: VerificationStatus,
  bav: VerificationStatus,
): { titleKey: string; textKey: string } {
  const ekycBad = ekyc === 'MISSING' || ekyc === 'REJECTED'
  const bavBad = bav === 'MISSING' || bav === 'REJECTED'
  if (ekycBad && bavBad) {
    return { titleKey: 'verification_banner', textKey: 'verification_banner_both_text' }
  }
  if (ekycBad) {
    return { titleKey: 'verification_banner', textKey: 'verification_banner_ekyc_text' }
  }
  return { titleKey: 'verification_banner', textKey: 'verification_banner_bav_text' }
}

function pickProgressCopy(
  ekyc: VerificationStatus,
  bav: VerificationStatus,
): { titleKey: string; textKey: string } {
  const ekycPending = ekyc === 'PENDING' || ekyc === 'IN_PROGRESS'
  const bavPending = bav === 'PENDING' || bav === 'IN_PROGRESS'
  if (ekycPending && bavPending) {
    return { titleKey: 'verification_in_progress_title', textKey: 'verification_in_progress_both' }
  }
  if (ekycPending) {
    return { titleKey: 'verification_in_progress_title', textKey: 'verification_in_progress_ekyc' }
  }
  return { titleKey: 'verification_in_progress_title', textKey: 'verification_in_progress_bav' }
}

/**
 * Verification banner with four mutually-exclusive states:
 *
 * - `success` — full verification complete. Optional, dismissible win-state
 *   shown via `showSuccess`; default is hidden so the home screen stays clean
 *   once everything is verified.
 * - `progress` — at least one verification is PENDING/IN_PROGRESS and none
 *   are MISSING/REJECTED.
 * - `action` — at least one verification is MISSING/REJECTED.
 * - hidden — fully verified and `showSuccess` is false.
 */
export function VerificationBanner({
  bootstrap,
  showSuccess = false,
}: {
  bootstrap: FarmerBootstrap
  showSuccess?: boolean
}) {
  const { t } = useTranslation()
  const { identityConfirmed, ekycStatus, bavStatus } = bootstrap

  const verified = isFullyVerified(identityConfirmed, ekycStatus, bavStatus)
  const needsAction = needsVerificationRemediation(ekycStatus, bavStatus)
  const inProgress =
    !needsAction &&
    !verified &&
    (ekycStatus === 'IN_PROGRESS' ||
      ekycStatus === 'PENDING' ||
      bavStatus === 'IN_PROGRESS' ||
      bavStatus === 'PENDING')

  const variant: BannerVariant | null = needsAction
    ? 'action'
    : inProgress
      ? 'progress'
      : verified && showSuccess
        ? 'success'
        : null

  if (!variant) return null

  if (variant === 'success') {
    return (
      <aside className="fp-banner fp-banner--success" role="status">
        <span className="fp-banner__icon" aria-hidden>
          <CheckCircle2 size={18} />
        </span>
        <div className="fp-banner__body">
          <p className="fp-banner__title">{t('verification_complete_title')}</p>
          <p className="fp-banner__text">{t('verification_complete_text')}</p>
        </div>
      </aside>
    )
  }

  if (variant === 'progress') {
    const copy = pickProgressCopy(ekycStatus, bavStatus)
    return (
      <aside className="fp-banner fp-banner--info" role="status">
        <span className="fp-banner__icon" aria-hidden>
          <Hourglass size={18} />
        </span>
        <div className="fp-banner__body">
          <p className="fp-banner__title">{t(copy.titleKey)}</p>
          <p className="fp-banner__text">{t(copy.textKey)}</p>
        </div>
      </aside>
    )
  }

  const copy = pickRemediationCopy(ekycStatus, bavStatus)
  const nextPath = getOnboardingNextPath(identityConfirmed, ekycStatus, bavStatus)
  return (
    <aside className="fp-banner fp-banner--alert" role="status">
      <span className="fp-banner__icon" aria-hidden>
        <ShieldAlert size={18} />
      </span>
      <div className="fp-banner__body">
        <p className="fp-banner__title">{t(copy.titleKey)}</p>
        <p className="fp-banner__text">{t(copy.textKey)}</p>
      </div>
      <Link
        href={nextPath}
        className="fp-btn fp-btn--on-brand fp-btn--sm fp-btn--inline fp-banner__cta"
      >
        {t('verify_now')}
      </Link>
    </aside>
  )
}
