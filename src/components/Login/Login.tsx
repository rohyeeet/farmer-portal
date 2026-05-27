'use client'

import { useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/useAuth'
import { useLoginFlow } from '../../hooks/useLoginFlow'
import { LanguageDropdown } from '../ui/LanguageDropdown'
import { PageLoading } from '../ui/PageLoading'
import LoginPanel from './LoginPanel'
import '../../styles/components/login/Login.css'

type LoginFormProps = {
  onLoggedIn: () => void
}

function LoginForm({ onLoggedIn }: LoginFormProps) {
  const flow = useLoginFlow(onLoggedIn)

  return (
    <LoginPanel
      step={flow.step}
      error={flow.error}
      infoMessage={flow.infoMessage}
      maskedPhone={flow.maskedPhone}
      defaultPhoneValue={flow.lastPhoneRaw}
      transactionId={flow.transactionId}
      resendCooldownSecondsRemaining={flow.resendCooldownSecondsRemaining}
      phoneSubmitting={flow.phoneSubmitting}
      otpSubmitting={flow.otpSubmitting}
      resendSubmitting={flow.resendSubmitting}
      onPhoneSubmit={flow.submitPhone}
      onOtpSubmitCode={flow.submitOtpCode}
      onResendOtp={flow.submitResendOtp}
      onBackFromOtp={flow.goToPhoneStep}
      onClearFeedback={flow.clearFeedback}
    />
  )
}

export default function Login() {
  const { t } = useTranslation()
  const { isAuthenticated, authHydrated } = useAuth()
  const router = useRouter()
  const onLoggedIn = useCallback(() => {
    router.replace('/')
  }, [router])

  useEffect(() => {
    if (!authHydrated) return
    if (isAuthenticated) {
      router.replace('/')
    }
  }, [authHydrated, isAuthenticated, router])

  if (!authHydrated || isAuthenticated) {
    return <PageLoading />
  }

  return (
    <div className="login-page">
      <div className="login-page__shell">
        <header className="login-page__brand">
          <Image
            src="/varaha_logo.png"
            alt="Varaha"
            width={140}
            height={44}
            priority
            className="login-page__logo"
          />
          <h1 className="login-page__title">{t('login_title')}</h1>
          <p className="login-page__subtitle">{t('login_subtitle')}</p>
          <LanguageDropdown className="login-page__lang" />
        </header>

        <LoginForm onLoggedIn={onLoggedIn} />

        <footer className="login-page__legal">
          {t('verified_secure')}
        </footer>
      </div>
    </div>
  )
}
