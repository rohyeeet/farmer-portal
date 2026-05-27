'use client'

import type { LoginStep } from '../../hooks/useLoginFlow'
import { useTranslation } from 'react-i18next'
import ArrowLeftIcon from '../../icons/common/ArrowLeftIcon'
import OtpLoginForm from './OtpLoginForm'
import PhoneLoginForm from './PhoneLoginForm'

type LoginPanelProps = {
  step: LoginStep
  error: string | null
  infoMessage: string | null
  maskedPhone: string
  defaultPhoneValue: string
  transactionId: string | null
  resendCooldownSecondsRemaining: number
  phoneSubmitting: boolean
  otpSubmitting: boolean
  resendSubmitting: boolean
  onPhoneSubmit: (phone: string) => void
  onOtpSubmitCode: (code: string) => void
  onResendOtp: () => void
  onBackFromOtp: () => void
  onClearFeedback: () => void
}

export default function LoginPanel({
  step,
  error,
  infoMessage,
  maskedPhone,
  defaultPhoneValue,
  transactionId,
  resendCooldownSecondsRemaining,
  phoneSubmitting,
  otpSubmitting,
  resendSubmitting,
  onPhoneSubmit,
  onOtpSubmitCode,
  onResendOtp,
  onBackFromOtp,
  onClearFeedback,
}: LoginPanelProps) {
  const { t } = useTranslation()
  const isOtp = step === 'otp'

  return (
    <section className="login-page__card" aria-labelledby="login-step-title">
      <div className="login-page__card-header">
        {isOtp ? (
          <button
            type="button"
            className="login-page__back"
            onClick={onBackFromOtp}
            aria-label={t('back_to_mobile')}
          >
            <ArrowLeftIcon />
          </button>
        ) : (
          <span className="login-page__back-spacer" aria-hidden />
        )}
        <div className="login-page__card-heading">
          <h2 id="login-step-title">{isOtp ? t('verify_login') : t('send_otp')}</h2>
          <p>
            {isOtp ? `${t('otp_sent_to')} ${maskedPhone}` : t('mobile_hint')}
          </p>
        </div>
        <span className="login-page__back-spacer" aria-hidden />
      </div>

      {isOtp && infoMessage && !error ? (
        <p className="login-page__info" role="status">
          {infoMessage}
        </p>
      ) : null}

      {isOtp ? (
        <OtpLoginForm
          key={transactionId ?? 'pending'}
          error={error}
          resendCooldownSecondsRemaining={resendCooldownSecondsRemaining}
          otpSubmitting={otpSubmitting}
          resendSubmitting={resendSubmitting}
          onBack={onBackFromOtp}
          onSubmitCode={onOtpSubmitCode}
          onResend={onResendOtp}
          onClearFeedback={onClearFeedback}
        />
      ) : (
        <PhoneLoginForm
          defaultPhoneValue={defaultPhoneValue}
          error={error}
          isSubmitting={phoneSubmitting}
          onSubmit={onPhoneSubmit}
          onClearError={onClearFeedback}
        />
      )}

      <p className="login-page__terms">
        By continuing, you agree to Varaha&apos;s Terms of Service and Privacy Policy.
      </p>
    </section>
  )
}
