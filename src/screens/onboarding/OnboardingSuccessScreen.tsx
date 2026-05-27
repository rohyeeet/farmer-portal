'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { OnboardingStepLayout } from '../../components/onboarding/OnboardingStepLayout'

export default function OnboardingSuccessScreen() {
  const { t } = useTranslation()

  return (
    <OnboardingStepLayout
      footer={
        <Link href="/" className="fp-btn fp-btn--primary fp-btn--lg">
          {t('go_dashboard')}
        </Link>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--fp-space-3)', textAlign: 'center', padding: 'var(--fp-space-4) 0' }}>
        <span className="fp-tile-icon fp-tile-icon--brand-solid fp-tile-icon--lg" aria-hidden>
          <CheckCircle2 size={28} strokeWidth={2.4} />
        </span>
        <h1 className="fp-onboarding__title">{t('bav_success_title')}</h1>
        <p className="fp-onboarding__lead">{t('bav_success_desc')}</p>
      </div>
    </OnboardingStepLayout>
  )
}
