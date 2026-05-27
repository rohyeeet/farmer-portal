'use client'

import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

export type WrongDetailsReason =
  | 'report_reason_name'
  | 'report_reason_phone'
  | 'report_reason_aadhaar'
  | 'report_reason_other'

const REASONS: WrongDetailsReason[] = [
  'report_reason_name',
  'report_reason_phone',
  'report_reason_aadhaar',
  'report_reason_other',
]

/**
 * Modal that captures *why* the farmer thinks the displayed profile is wrong,
 * then hands control back to the parent with the chosen reason. The parent is
 * responsible for routing (we send the user to /support/ with a prefill in
 * `ClaimProfileScreen`) and for surfacing the `wrong_details_acknowledged`
 * toast so the farmer knows the message was queued and they can continue.
 *
 * The dialog is keyboard-friendly (Esc closes, autofocuses the first option).
 */
export function WrongDetailsDialog({
  open,
  onCancel,
  onSubmit,
}: {
  open: boolean
  onCancel: () => void
  onSubmit: (reason: WrongDetailsReason) => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<WrongDetailsReason>('report_reason_name')
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fp-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="fp-dialog">
        <header className="fp-dialog__head">
          <h2 id={titleId} className="fp-dialog__title">
            {t('report_issue_title')}
          </h2>
          <button
            type="button"
            className="fp-dialog__close"
            aria-label={t('close')}
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </header>
        <p id={descId} className="fp-dialog__desc">
          {t('report_issue_desc')}
        </p>
        <fieldset className="fp-dialog__reasons">
          <legend className="fp-sr-only">{t('report_issue_title')}</legend>
          {REASONS.map((r, i) => (
            <label key={r} className={`fp-radio${reason === r ? ' fp-radio--checked' : ''}`}>
              <input
                type="radio"
                name="wrong-details-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                autoFocus={i === 0}
              />
              <span>{t(r)}</span>
            </label>
          ))}
        </fieldset>
        <div className="fp-dialog__actions">
          <button
            type="button"
            className="fp-btn fp-btn--primary"
            onClick={() => onSubmit(reason)}
          >
            {t('report_submit')}
          </button>
          <button
            type="button"
            className="fp-btn fp-btn--ghost"
            onClick={onCancel}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
