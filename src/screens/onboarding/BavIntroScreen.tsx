'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Check, Wallet } from 'lucide-react'
import { useBootstrap } from '../../bootstrap/BootstrapProvider'
import { OnboardingStepLayout } from '../../components/onboarding/OnboardingStepLayout'
import { hasBankAccountOnRecord } from '../../utils/onboardingPrerequisites'

export default function BavIntroScreen() {
  const { t } = useTranslation()
  const { bootstrap } = useBootstrap()
  const router = useRouter()
  const hasBankOnFile = bootstrap ? hasBankAccountOnRecord(bootstrap) : false

  useEffect(() => {
    if (bootstrap?.bavStatus === 'ACCEPTED') {
      router.replace('/onboarding/success/')
    }
  }, [bootstrap, router])

  return (
    <OnboardingStepLayout
      backHref="/"
      footer={
        <Link href="/onboarding/bav-form/" className="fp-btn fp-btn--primary fp-btn--lg">
          {hasBankOnFile ? t('review_account') : t('enter_bank_details')}
        </Link>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--fp-space-3)' }}>
        <span className="fp-tile-icon fp-tile-icon--brand fp-tile-icon--lg" aria-hidden>
          <Wallet size={28} />
        </span>
        <h1 className="fp-onboarding__title">{t('bav_intro_title')}</h1>
        <p className="fp-onboarding__lead">
          {hasBankOnFile ? t('bav_intro_desc') : t('bav_intro_desc_enter')}
        </p>
      </div>

      <div className="fp-benefit-list">
        <div className="fp-benefit-tile">
          <span className="fp-benefit-tile__icon">
            <Check size={14} strokeWidth={3} />
          </span>
          <p className="fp-benefit-tile__text">{t('bav_helper')}</p>
        </div>
      </div>
    </OnboardingStepLayout>
  )
}
