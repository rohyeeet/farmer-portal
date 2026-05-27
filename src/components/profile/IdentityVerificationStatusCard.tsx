'use client'

import { useTranslation } from 'react-i18next'
import { StatusBadge } from '../ui/StatusBadge'
import type { VerificationStatus } from '../../types/verification.types'

export type IdentityStatusRow = {
  labelKey: string
  hintKey: string
  status: VerificationStatus
}

/**
 * Two-track verification summary (API check + document review) for
 * National ID and Bank sections in profile.
 */
export function IdentityVerificationStatusCard({
  rows,
  compact = false,
  embedded = false,
}: {
  rows: IdentityStatusRow[]
  compact?: boolean
  /** Inside the identity detail stack — no outer card chrome. */
  embedded?: boolean
}) {
  const { t } = useTranslation()

  const className = [
    'fp-identity-dual-status',
    compact ? 'fp-identity-dual-status--compact' : '',
    embedded ? 'fp-identity-dual-status--embedded' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} role="list">
      {rows.map((row) => (
        <div key={row.labelKey} className="fp-identity-dual-status__row" role="listitem">
          <div className="fp-identity-dual-status__copy">
            <p className="fp-identity-dual-status__label">{t(row.labelKey)}</p>
            {!compact ? (
              <p className="fp-identity-dual-status__hint">{t(row.hintKey)}</p>
            ) : null}
          </div>
          <StatusBadge status={row.status} />
        </div>
      ))}
    </div>
  )
}
