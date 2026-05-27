'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, Headphones } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type OnboardingStep = 1 | 2 | 3 | 4

export function OnboardingStepLayout({
  backHref,
  hero,
  children,
  footer,
}: {
  backHref?: string
  /**
   * Soft brand-tinted hero rendered at the top of the card (claim screen uses this).
   * Pass an icon/title/sub combo or anything; it'll sit in `.fp-onboarding__card-hero`.
   */
  hero?: ReactNode
  children: ReactNode
  /** Sticky-feeling footer inside the card (primary CTA + secondary link). */
  footer?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="fp-onboarding">
      <div className="fp-onboarding__top">
        {backHref ? (
          <Link
            href={backHref}
            className="fp-onboarding__back"
            aria-label={t('back')}
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </Link>
        ) : (
          <span style={{ width: '2.5rem', height: '2.5rem' }} aria-hidden />
        )}
      </div>

      <div className="fp-onboarding__card">
        {hero ? <div className="fp-onboarding__card-hero">{hero}</div> : null}
        <div className={`fp-onboarding__card-body${hero ? '' : ' fp-onboarding__card-body--no-hero'}`}>
          {children}
          {footer ? <div style={{ display: 'grid', gap: 'var(--fp-space-2)', marginTop: 'var(--fp-space-2)' }}>{footer}</div> : null}
        </div>
      </div>

      <div className="fp-onboarding__footer">
        <Link href="/support/" className="fp-onboarding__support">
          <Headphones size={14} strokeWidth={2.2} aria-hidden /> {t('support_access_online')}
        </Link>
        <span className="fp-onboarding__brand-footer">{t('varaha_infrastructure')}</span>
      </div>
    </div>
  )
}
