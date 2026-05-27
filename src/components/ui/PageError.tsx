'use client'

import { useTranslation } from 'react-i18next'
import '../../styles/components/ui/Feedback.css'

export function PageError({
  message,
  onRetry,
  onLogout,
}: {
  message: string
  onRetry?: () => void
  onLogout?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="fp-feedback fp-feedback--error" role="alert">
      <p className="fp-feedback__title">{t('error_generic')}</p>
      <p className="fp-feedback__text">{message}</p>
      <div className="fp-feedback__actions">
        {onRetry ? (
          <button type="button" className="fp-btn fp-btn--primary" onClick={onRetry}>
            {t('try_again')}
          </button>
        ) : null}
        {onLogout ? (
          <button type="button" className="fp-btn" onClick={onLogout}>
            {t('logout')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
