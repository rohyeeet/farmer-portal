'use client'

import { useTranslation } from 'react-i18next'
import '../../styles/components/ui/Feedback.css'

export function PageLoading({
  label,
  inline = false,
}: {
  label?: string
  inline?: boolean
}) {
  const { t } = useTranslation()
  const cls = `fp-feedback${inline ? '' : ' fp-feedback--loading'}`
  return (
    <div className={cls} role="status" aria-live="polite">
      <div className="fp-feedback__spinner" aria-hidden />
      <p className="fp-feedback__text">{label ?? t('loading')}</p>
    </div>
  )
}
