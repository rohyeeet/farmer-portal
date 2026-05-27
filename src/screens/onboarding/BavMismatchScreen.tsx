'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ImageIcon } from 'lucide-react'
import { OnboardingStepLayout } from '../../components/onboarding/OnboardingStepLayout'

export default function BavMismatchScreen() {
  const { t } = useTranslation()

  return (
    <OnboardingStepLayout
      backHref="/onboarding/bav-form/"
      footer={
        <>
          <Link href="/onboarding/bav-form/" className="fp-btn fp-btn--dark fp-btn--lg">
            {t('recheck_correct')}
          </Link>
          <div style={{ textAlign: 'center', color: 'var(--fp-color-text-muted)', fontSize: 'var(--fp-text-2xs)', fontWeight: 800, letterSpacing: 'var(--fp-tracking-wider)', textTransform: 'uppercase' }}>
            {t('or_divider')}
          </div>
          <Link href="/onboarding/bav-form/?mode=update" className="fp-btn fp-btn--primary-soft fp-btn--lg">
            <ImageIcon size={16} aria-hidden /> {t('provide_other_bank')}
          </Link>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--fp-space-3)', textAlign: 'center' }}>
        <span className="fp-tile-icon fp-tile-icon--rose" aria-hidden style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%' }}>
          <AlertCircle size={26} strokeWidth={2.2} />
        </span>
        <h1 className="fp-onboarding__title">{t('mismatch_title')}</h1>
        <p className="fp-onboarding__lead">{t('mismatch_desc')}</p>
      </div>
    </OnboardingStepLayout>
  )
}
