'use client'

import { Check, Circle, Clock, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { VerificationStatus } from '../../types/verification.types'
import { mapVerificationToChip } from '../../utils/bootstrapMapping'

const LABEL_KEYS: Record<VerificationStatus, string> = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  MISSING: 'missing',
}

type Tone = ReturnType<typeof mapVerificationToChip>

const ICONS: Record<Tone, typeof Check> = {
  accepted: Check,
  pending: Clock,
  rejected: X,
  default: Circle,
}

export function StatusBadge({
  status,
  withIcon = true,
}: {
  status: VerificationStatus
  withIcon?: boolean
}) {
  const { t } = useTranslation()
  const tone = mapVerificationToChip(status)
  const label = t(LABEL_KEYS[status] ?? 'pending')
  const Icon = ICONS[tone]

  return (
    <span className={`fp-status fp-status--${tone}`}>
      {withIcon ? (
        <span className="fp-status__dot" aria-hidden>
          <Icon size={12} strokeWidth={3} />
        </span>
      ) : null}
      {label}
    </span>
  )
}
