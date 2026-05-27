'use client'

import { useTranslation } from 'react-i18next'

type PhoneLoginFormProps = {
  defaultPhoneValue?: string
  error: string | null
  isSubmitting: boolean
  onSubmit: (phone: string) => void
  onClearError: () => void
}

export default function PhoneLoginForm({
  defaultPhoneValue = '',
  error,
  isSubmitting,
  onSubmit,
  onClearError,
}: PhoneLoginFormProps) {
  const { t } = useTranslation()

  return (
    <form
      className="login-page__form"
      onSubmit={(e) => {
        e.preventDefault()
        if (isSubmitting) return
        const raw = new FormData(e.currentTarget).get('phone_number')
        const phone = typeof raw === 'string' ? raw.trim() : ''
        void onSubmit(phone)
      }}
    >
      <label className="login-page__field-label" htmlFor="phone_number">
        {t('mobile_number')}
      </label>
      <div className="login-page__phone-row">
        <span className="login-page__phone-prefix" aria-hidden>
          +91
        </span>
        <input
          id="phone_number"
          name="phone_number"
          className="login-page__phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="9876543210"
          maxLength={10}
          defaultValue={defaultPhoneValue.replace(/\D/g, '').slice(-10)}
          disabled={isSubmitting}
          onInput={onClearError}
        />
      </div>

      {error ? (
        <div className="login-page__error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <button
        type="submit"
        className="fp-btn fp-btn--primary fp-btn--login-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('loading') : t('send_otp')}
      </button>
    </form>
  )
}
